import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { createSession, hashPassword } from '../src/auth.js';

const schema = z.object({
  applicationCode: z.string().trim().min(8).max(64),
  email: z.string().email().max(254),
  password: z.string().min(10).max(128),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_request' });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return res.status(503).json({ error: 'backend_not_configured' });

  const sql = neon(databaseUrl);
  const input = parsed.data;

  const applications = await sql`
    select application_code, email, status
    from one_driver_applications
    where application_code = ${input.applicationCode}
      and lower(email) = lower(${input.email})
    limit 1
  `;

  const application = applications[0];
  if (!application || application.status !== 'approved') {
    return res.status(403).json({ error: 'driver_not_approved' });
  }

  const users = await sql`
    select id, role, full_name, email, phone, locale
    from one_users
    where role = 'driver'
      and lower(email) = lower(${input.email})
      and status = 'active'
      and deleted_at is null
    limit 1
  `;

  const user = users[0];
  if (!user) return res.status(404).json({ error: 'driver_account_not_found' });

  const passwordHash = await hashPassword(input.password);
  await sql`
    update one_users
    set password_hash = ${passwordHash},
        updated_at = now()
    where id = ${user.id}
  `;

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
