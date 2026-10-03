import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { getSessionUser } from '../src/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  const user = await getSessionUser(req);
  if (!user || ['admin', 'dispatcher'].includes(user.role)) return res.status(401).json({ error: 'passenger_unauthorized' });

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
      status,
      payment_status,
      quote_amount_minor,
      quote_currency,
      u.full_name as driver_name,
      u.phone as driver_phone,
      v.make as vehicle_make,
      v.model as vehicle_model,
      v.vehicle_year,
      v.color as vehicle_color,
      v.plate_number,
      r.created_at,
      r.updated_at
    from one_reservations r
    left join one_users u on u.id = r.assigned_driver_user_id
    left join one_driver_vehicles v on v.id = r.assigned_vehicle_id
    where r.passenger_user_id = ${user.id}
    order by r.created_at desc
    limit 100
  `;

  return res.status(200).json({ trips: rows });
}
