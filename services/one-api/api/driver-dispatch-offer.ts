import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { getSessionUser } from '../src/auth.js';
import { dispatchTokenSchema, dispatchTokenHash, dispatchEligibleVehicleSql, claimDispatchOfferSql } from '../src/dispatch-offers.js';
import { sendPushToUser } from '../src/notifications.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  res.setHeader('Cache-Control','private, no-store');
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  const user = await getSessionUser(req);
  if (!user || user.role !== 'driver') return res.status(401).json({error:'driver_unauthorized'});
  const parsed = dispatchTokenSchema.safeParse(req.body?.token);
  if (!parsed.success || !['preview','accept'].includes(req.body?.action)) return res.status(400).json({error:'invalid_request'});
  if (!process.env.DATABASE_URL) return res.status(503).json({error:'backend_not_configured'});
  const sql = neon(process.env.DATABASE_URL);
  const hash = dispatchTokenHash(parsed.data);
  // Safe replay after a lost response. Never reassign or write a second event.
  const own = await sql`select request_code from one_reservations where driver_offer_token_hash = ${hash} and assigned_driver_user_id = ${user.id} and status in ('assigned','driver_en_route','arrived','passenger_onboard','completed') limit 1`;
  if (own[0]) return res.status(200).json({status:'assigned',requestCode:own[0].request_code});
  if (req.body.action === 'preview') {
    const rows = await sql.query(`select r.market_id, r.vehicle_class_id, r.passenger_count,
      r.pickup_date_text, r.pickup_time_text, r.driver_offer_summary as summary,
      r.driver_offer_amount_minor as amount_minor, r.quote_currency as currency,
      r.driver_offer_expires_at as expires_at
      from one_reservations r where r.driver_offer_token_hash = $2
        and r.driver_offer_expires_at > now() and r.status = 'confirmed'
        and r.payment_status = 'paid' and r.assigned_driver_user_id is null
        and exists (${dispatchEligibleVehicleSql}) limit 1`,[user.id,hash]);
    if (!rows[0]) return res.status(409).json({error:'offer_unavailable_or_ineligible'});
    return res.status(200).json({status:'offered',offer:rows[0]});
  }
  const claimed = await sql.query(claimDispatchOfferSql,[user.id,hash]);
  if (!claimed[0]) {
    const retry = await sql`select request_code from one_reservations where driver_offer_token_hash = ${hash} and assigned_driver_user_id = ${user.id} and status = 'assigned' limit 1`;
    if (retry[0]) return res.status(200).json({status:'assigned',requestCode:retry[0].request_code});
    return res.status(409).json({error:'offer_unavailable_or_ineligible'});
  }
  try {
    await sendPushToUser(claimed[0].passenger_user_id ? String(claimed[0].passenger_user_id) : null,'Your ONE driver is assigned','Open My Reservations to see your driver and vehicle.',{requestCode:String(claimed[0].request_code),url:'/trips'});
  } catch { /* Assignment is committed; notification failure must not undo it. */ }
  return res.status(200).json({status:'assigned',requestCode:claimed[0].request_code});
}
