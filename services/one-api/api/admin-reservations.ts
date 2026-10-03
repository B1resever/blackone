import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { isAdminAuthorized } from '../src/admin-auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  if (!isAdminAuthorized(req)) return res.status(401).json({ error: 'unauthorized' });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return res.status(503).json({ error: 'backend_not_configured' });

  const sql = neon(databaseUrl);
  const rows = await sql`
    select
      id,
      request_code,
      market_id,
      ride_type,
      pickup_text,
      dropoff_text,
      pickup_date_text,
      pickup_time_text,
      passenger_count,
      vehicle_class_id,
      guest_full_name,
      guest_email,
      guest_phone,
      status,
      payment_status,
      quote_amount_minor,
      quote_currency,
      assigned_driver_user_id,
      created_at,
      updated_at
    from one_reservations
    order by created_at desc
    limit 250
  `;

  return res.status(200).json({ reservations: rows });
}
