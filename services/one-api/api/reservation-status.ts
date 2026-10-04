import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { allowCors, methodNotAllowed } from '../src/http.js';

const schema = z.object({
  requestCode: z.string().trim().min(8).max(64),
  email: z.string().email().max(254),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_request' });

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
      vehicle_class_id,
      passenger_count,
      status,
      payment_status,
      quote_amount_minor,
      quote_currency,
      ride_code,
      ride_code_verified_at,
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
    where r.request_code = ${parsed.data.requestCode}
      and lower(r.guest_email) = lower(${parsed.data.email})
    limit 1
  `;

  if (!rows[0]) return res.status(404).json({ error: 'reservation_not_found' });

  return res.status(200).json({ reservation: rows[0] });
}
