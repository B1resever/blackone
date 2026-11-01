import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { isAdminAuthorized } from '../src/admin-auth.js';
import { createDispatchOfferSchema, dispatchTokenHash } from '../src/dispatch-offers.js';
import { scheduledRideInstant } from '../src/scheduled-rides.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  res.setHeader('Cache-Control','private, no-store');
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  if (!(await isAdminAuthorized(req))) return res.status(401).json({error:'unauthorized'});
  const parsed = createDispatchOfferSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({error:'invalid_request'});
  if (!process.env.DATABASE_URL) return res.status(503).json({error:'backend_not_configured'});
  const sql = neon(process.env.DATABASE_URL);
  const input = parsed.data;
  const rows = await sql`select market_id, pickup_date_text, pickup_time_text from one_reservations where request_code = ${input.requestCode} and quote_currency in ('USD','ARS') and quote_amount_minor > 0 and status = 'confirmed' and payment_status = 'paid' and assigned_driver_user_id is null limit 1`;
  const r = rows[0];
  if (!r) return res.status(409).json({error:'trip_not_available'});
  const pickup = scheduledRideInstant(String(r.pickup_date_text),String(r.pickup_time_text),String(r.market_id));
  if (pickup === null || pickup <= Date.now()) return res.status(409).json({error:'scheduled_pickup_required'});
  const expiresAt = new Date(Math.min(pickup, Date.now() + input.expiresInMinutes * 60000)).toISOString();
  const token = randomBytes(32).toString('base64url');
  const updated = await sql`
    update one_reservations set driver_offer_token_hash = ${dispatchTokenHash(token)},
      driver_offer_expires_at = ${expiresAt}, driver_offer_amount_minor = ${input.driverAmountMinor},
      driver_offer_summary = ${input.summary}, updated_at = now()
    where request_code = ${input.requestCode} and quote_currency in ('USD','ARS') and quote_amount_minor > 0 and status = 'confirmed' and payment_status = 'paid'
      and assigned_driver_user_id is null
    returning request_code
  `;
  if (!updated[0]) return res.status(409).json({error:'trip_not_available'});
  // A URL fragment keeps invitation tokens out of ordinary HTTP access logs.
  return res.status(200).json({offerUrl:'https://b1reserve.com/one-driver-offer.html#token='+token,expiresAt,delivery:'manual_whatsapp_share',message:'Share only with your opted-in B1 driver list. This endpoint has not sent a WhatsApp message.'});
}
