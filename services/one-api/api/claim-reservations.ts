import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { getSessionUser } from '../src/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const user = await getSessionUser(req);
  if (!user || !user.email) return res.status(401).json({ error: 'unauthorized' });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return res.status(503).json({ error: 'backend_not_configured' });

  const sql = neon(databaseUrl);
  const rows = await sql`
    update one_reservations
    set passenger_user_id = ${user.id},
        updated_at = now()
    where passenger_user_id is null
      and guest_email is not null
      and lower(guest_email) = lower(${user.email})
    returning id
  `;

  return res.status(200).json({ claimed: rows.length });
}
