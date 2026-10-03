import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { getSessionUser } from '../src/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: 'unauthorized' });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return res.status(503).json({ error: 'backend_not_configured' });
  const sql = neon(databaseUrl);

  await sql`
    update one_users
    set
      full_name = 'Deleted ONE User',
      email = null,
      phone = null,
      password_hash = null,
      status = 'deleted',
      deleted_at = now(),
      updated_at = now()
    where id = ${user.id}
  `;

  await sql`
    update one_reservations
    set
      guest_full_name = case when passenger_user_id = ${user.id} then null else guest_full_name end,
      guest_email = case when passenger_user_id = ${user.id} then null else guest_email end,
      guest_phone = case when passenger_user_id = ${user.id} then null else guest_phone end,
      notes = case when passenger_user_id = ${user.id} then null else notes end,
      updated_at = now()
    where passenger_user_id = ${user.id}
  `;

  await sql`delete from one_auth_sessions where user_id = ${user.id}`;

  return res.status(200).json({
    deleted: true,
    message: 'ONE account deleted. Operational records may remain where required for legal, financial, fraud-prevention or safety obligations.',
  });
}
