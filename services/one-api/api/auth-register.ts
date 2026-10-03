import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { createSession, hashPassword } from '../src/auth.js';

const schema = z.object({
  fullName: z.string().trim().min(2).max(160),
  email: z.string().email().max(254),
  phone: z.string().trim().min(7).max(40),
  password: z.string().min(10).max(128),
  locale: z.string().trim().min(2).max(12).default('en'),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return res.status(503).json({ error: 'backend_not_configured' });

  const sql = neon(databaseUrl);
  const input = parsed.data;
  const email = input.email.toLowerCase();

  const existing = await sql`
    select id
    from one_users
    where lower(email) = lower(${email})
      and deleted_at is null
    limit 1
  `;

  if (existing[0]) return res.status(409).json({ error: 'account_exists' });

  const passwordHash = await hashPassword(input.password);
  const rows = await sql`
    insert into one_users (
      role,
      full_name,
      email,
      phone,
      locale,
      status,
      password_hash
    ) values (
      'passenger',
      ${input.fullName},
      ${email},
      ${input.phone},
      ${input.locale},
      'active',
      ${passwordHash}
    )
    returning id, role, full_name, email, phone, locale
  `;

  const user = rows[0];
  const session = await createSession(String(user.id));

  return res.status(201).json({
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
