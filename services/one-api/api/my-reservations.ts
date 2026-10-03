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
      created_at,
      updated_at
    from one_reservations
    where passenger_user_id = ${user.id}
    order by created_at desc
    limit 100
  `;

  return res.status(200).json({ trips: rows });
}
