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
      u.id,
      u.full_name,
      u.email,
      u.phone,
      u.status,
      p.home_market_id,
      p.verification_status,
      p.driver_fee_model,
      p.monthly_cap_amount_minor,
      p.percent_per_trip
    from one_users u
    join one_driver_profiles p on p.user_id = u.id
    where u.role = 'driver'
      and u.status = 'active'
      and p.verification_status = 'approved'
    order by p.home_market_id, u.full_name
  `;

  return res.status(200).json({ drivers: rows });
}
