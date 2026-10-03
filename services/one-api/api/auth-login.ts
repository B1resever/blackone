import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { createSession, verifyPassword } from '../src/auth.js';

const schema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
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
    select id, role, full_name, email, phone, locale, password_hash
    from one_users
    where lower(email) = lower(${parsed.data.email})
      and status = 'active'
      and deleted_at is null
    limit 1
  `;

  const user = rows[0];
  const valid = user ? await verifyPassword(parsed.data.password, String(user.password_hash ?? '')) : false;
  if (!user || !valid) return res.status(401).json({ error: 'invalid_credentials' });

  const session = await createSession(String(user.id));
  return res.status(200).json({
    user: {
      id: user.id,
      role: user.role,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      locale: user.locale,
    },
    session,
  });
}
