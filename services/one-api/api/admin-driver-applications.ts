import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { isAdminAuthorized } from '../src/admin-auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  if (!(await isAdminAuthorized(req))) return res.status(401).json({ error: 'unauthorized' });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return res.status(503).json({ error: 'backend_not_configured' });

  const sql = neon(databaseUrl);
  const rows = await sql`
    select
      application_code,
      market_id,
      full_name,
      email,
      phone,
      license_region,
      vehicle_year,
      vehicle_make,
      vehicle_model,
      plate_number,
      vehicle_class_id,
      status,
      review_notes,
      created_at,
      updated_at
    from one_driver_applications
    order by created_at desc
    limit 250
  `;

  return res.status(200).json({ applications: rows });
}
