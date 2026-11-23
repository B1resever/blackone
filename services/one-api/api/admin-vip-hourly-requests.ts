import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { isAdminAuthorized } from '../src/admin-auth.js';
import { allowCors, methodNotAllowed } from '../src/http.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (allowCors(req, res)) return;
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  try {
    if (!(await isAdminAuthorized(req))) return res.status(401).json({ error: 'unauthorized' });
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) return res.status(503).json({ error: 'vip_requests_unavailable' });

    const sql = neon(databaseUrl);
    const requests = await sql`
      select request_id, vehicle_key, pickup_at, pickup_address, destination_address,
             duration_hours, passengers, guest_full_name, guest_email, guest_phone,
             status, quote, preferred_payment_method, created_at
      from b1_vip_hourly_requests
      order by created_at desc, request_id desc
      limit 100
    `;
    return res.status(200).json({ requests });
  } catch {
    return res.status(503).json({ error: 'vip_requests_unavailable' });
  }
}
