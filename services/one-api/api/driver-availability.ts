import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { getSessionUser } from '../src/auth.js';

const schema = z.object({ available: z.boolean() });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (!['GET','POST'].includes(req.method ?? '')) return methodNotAllowed(res, ['GET','POST']);

  const user = await getSessionUser(req);
  if (!user || user.role !== 'driver') return res.status(401).json({ error: 'driver_unauthorized' });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return res.status(503).json({ error: 'backend_not_configured' });

  const sql = neon(databaseUrl);

  if (req.method === 'GET') {
    const rows = await sql`
      select available_for_assignment, compliance_status, verification_status
      from one_driver_profiles
      where user_id = ${user.id}
      limit 1
    `;
    if (!rows[0]) return res.status(404).json({ error: 'driver_profile_not_found' });
    return res.status(200).json({ availability: rows[0] });
  }

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_request' });

  const rows = await sql`
    select compliance_status, verification_status
    from one_driver_profiles
    where user_id = ${user.id}
    limit 1
  `;
  const profile = rows[0];
  if (!profile) return res.status(404).json({ error: 'driver_profile_not_found' });

  if (parsed.data.available && (profile.compliance_status !== 'approved' || profile.verification_status !== 'approved')) {
    return res.status(409).json({ error: 'driver_not_compliant' });
  }

  await sql`
    update one_driver_profiles
    set available_for_assignment = ${parsed.data.available},
        availability_updated_at = now(),
        updated_at = now()
    where user_id = ${user.id}
  `;

  return res.status(200).json({
    available: parsed.data.available,
    complianceStatus: profile.compliance_status,
  });
}
