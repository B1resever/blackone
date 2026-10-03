import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { getSessionUser } from '../src/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  const user = await getSessionUser(req);
  if (!user || user.role !== 'driver') return res.status(401).json({ error: 'driver_unauthorized' });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return res.status(503).json({ error: 'backend_not_configured' });

  const sql = neon(databaseUrl);
  const rows = await sql`
    select
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
      guest_phone,
      status,
      payment_status,
      quote_amount_minor,
      quote_currency,
      created_at,
      updated_at
    from one_reservations
    where assigned_driver_user_id = ${user.id}
      and status not in ('cancelled')
    order by
      case when status = 'completed' then 1 else 0 end,
      pickup_date_text asc,
      pickup_time_text asc
    limit 100
  `;

  return res.status(200).json({ trips: rows });
}
