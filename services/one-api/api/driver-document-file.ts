import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { getSessionUser } from '../src/auth.js';
import { isAdminAuthorized } from '../src/admin-auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  res.setHeader('Cache-Control', 'private, no-store');
  const user = await getSessionUser(req);
  const admin = user ? ['admin', 'dispatcher'].includes(user.role) : await isAdminAuthorized(req);
  if (!admin && user?.role !== 'driver') return res.status(401).json({ error: 'unauthorized' });
  const id = z.string().uuid().safeParse(req.query.id);
  if (!id.success) return res.status(400).json({ error: 'invalid_document_id' });
  if (!process.env.DATABASE_URL) return res.status(503).json({ error: 'backend_not_configured' });
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`
    select f.mime_type, encode(f.contents, 'base64') as data
    from one_driver_document_files f
    join one_driver_documents d on d.id = f.document_id
    where d.id = ${id.data}
      and (${admin} or d.driver_user_id = ${user?.id ?? null}::uuid)
    limit 1
  `;
  if (!rows[0]) return res.status(404).json({ error: 'document_not_found' });
  res.setHeader('Content-Type', String(rows[0].mime_type));
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', 'inline; filename="driver-document.' + (rows[0].mime_type === 'image/png' ? 'png' : 'jpg') + '"');
  return res.status(200).send(Buffer.from(String(rows[0].data), 'base64'));
}
