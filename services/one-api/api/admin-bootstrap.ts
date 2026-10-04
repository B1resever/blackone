import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { hashPassword } from '../src/auth.js';

const schema = z.object({
  fullName: z.string().trim().min(2).max(160),
  email: z.string().email().max(254),
  password: z.string().min(12).max(128),
});

function masterAuthorized(req: VercelRequest) {
  const expected = process.env.ONE_ADMIN_API_TOKEN?.trim();
  const header = typeof req.headers.authorization === 'string' ? req.headers.authorization : '';
  return Boolean(expected && header === 'Bearer ' + expected);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  if (!masterAuthorized(req)) return res.status(401).json({ error: 'unauthorized' });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return res.status(503).json({ error: 'backend_not_configured' });

  const sql = neon(databaseUrl);
  const email = parsed.data.email.toLowerCase();
  const passwordHash = await hashPassword(parsed.data.password);

  const existing = await sql`
    select id
    from one_users
    where lower(email) = lower(${email})
    limit 1
  `;

  let rows;
  if (existing[0]?.id) {
    rows = await sql`
      update one_users
      set role = 'admin',
          full_name = ${parsed.data.fullName},
          status = 'active',
          password_hash = ${passwordHash},
          deleted_at = null,
          updated_at = now()
      where id = ${existing[0].id}
      returning id, role, full_name, email
    `;
  } else {
    rows = await sql`
      insert into one_users (role, full_name, email, phone, locale, status, password_hash)
      values ('admin', ${parsed.data.fullName}, ${email}, null, 'en', 'active', ${passwordHash})
      returning id, role, full_name, email
    `;
  }

  return res.status(200).json({
    created: true,
    user: {
      id: rows[0].id,
      role: rows[0].role,
      fullName: rows[0].full_name,
      email: rows[0].email,
    },
  });
}
