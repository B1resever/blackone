import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { isAdminAuthorized } from '../src/admin-auth.js';

const querySchema = z.object({
  email: z.string().email().max(254),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  if (!(await isAdminAuthorized(req))) return res.status(401).json({ error: 'unauthorized' });

  const value = Array.isArray(req.query.email) ? req.query.email[0] : req.query.email;
  const parsed = querySchema.safeParse({ email: value });
  if (!parsed.success) return res.status(400).json({ error: 'invalid_request' });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return res.status(503).json({ error: 'backend_not_configured' });
  const sql = neon(databaseUrl);

  const rows = await sql`
    select id, role, full_name, email, phone, locale, status, deleted_at, created_at
    from one_users
    where lower(email) = lower(${parsed.data.email})
    limit 1
  `;

  const user = rows[0];
  if (!user) return res.status(404).json({ error: 'account_not_found' });

  return res.status(200).json({
    user: {
      id: user.id,
      role: user.role,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      locale: user.locale,
      status: user.status,
      deleted: Boolean(user.deleted_at),
      createdAt: user.created_at,
    },
  });
}
