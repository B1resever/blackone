import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { getSessionUser, hashPassword } from '../src/auth.js';
import { isAdminAuthorized } from '../src/admin-auth.js';

const schema = z.object({
  email: z.string().email().max(254),
  newPassword: z.string().min(12).max(128),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  if (!(await isAdminAuthorized(req))) return res.status(401).json({ error: 'unauthorized' });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return res.status(503).json({ error: 'backend_not_configured' });
  const sql = neon(databaseUrl);

  const rows = await sql`
    select id, role, full_name, email, status, deleted_at
    from one_users
    where lower(email) = lower(${parsed.data.email})
    limit 1
  `;
  const target = rows[0];
  if (!target) return res.status(404).json({ error: 'account_not_found' });
  if (target.deleted_at || target.status !== 'active') {
    return res.status(409).json({ error: 'account_not_active' });
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await sql`
    update one_users
    set password_hash = ${passwordHash},
        updated_at = now()
    where id = ${target.id}
  `;

  await sql`
    delete from one_sessions
    where user_id = ${target.id}
  `;

  const actor = await getSessionUser(req);
  await sql`
    insert into one_account_events (target_user_id, actor_user_id, event_type, payload)
    values (
      ${target.id},
      ${actor?.id ?? null},
      'support_password_reset',
      jsonb_build_object('target_role', ${target.role}, 'source', 'ONE Command Center')
    )
  `;

  return res.status(200).json({
    reset: true,
    user: {
      id: target.id,
      role: target.role,
      fullName: target.full_name,
      email: target.email,
    },
    sessionsRevoked: true,
  });
}
