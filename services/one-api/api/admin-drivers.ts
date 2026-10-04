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
      u.id,
      u.full_name,
      u.email,
      u.phone,
      u.status,
      p.home_market_id,
      p.verification_status,
      p.driver_fee_model,
      p.monthly_cap_amount_minor,
      p.percent_per_trip,
      p.compliance_status,
      p.available_for_assignment,
      p.availability_updated_at,
      v.id as vehicle_id,
      v.vehicle_class_id,
      v.make as vehicle_make,
      v.model as vehicle_model,
      v.vehicle_year,
      v.plate_number
    from one_users u
    join one_driver_profiles p on p.user_id = u.id
    left join lateral (
      select id, vehicle_class_id, make, model, vehicle_year, plate_number
      from one_driver_vehicles
      where driver_user_id = u.id
        and status = 'approved'
      order by updated_at desc
      limit 1
    ) v on true
    where u.role = 'driver'
      and u.status = 'active'
      and p.verification_status = 'approved'
      and p.compliance_status = 'approved'
      and p.available_for_assignment = true
      and (
        select count(distinct d.document_type)
        from one_driver_documents d
        where d.driver_user_id = u.id
          and d.document_type in ('driver_license','insurance','vehicle_registration','background_check')
          and d.status = 'approved'
          and (d.expires_on is null or d.expires_on >= current_date)
      ) = 4
    order by p.home_market_id, u.full_name
  `;

  return res.status(200).json({ drivers: rows });
}
