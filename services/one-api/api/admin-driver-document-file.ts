import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { isAdminAuthorized } from '../src/admin-auth.js';

const querySchema = z.object({
  documentId: z.string().uuid(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  if (!isAdminAuthorized(req)) return res.status(401).json({ error: 'unauthorized' });

  const documentId = Array.isArray(req.query.documentId) ? req.query.documentId[0] : req.query.documentId;
  const parsed = querySchema.safeParse({ documentId });
  if (!parsed.success) return res.status(400).json({ error: 'invalid_request' });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return res.status(503).json({ error: 'backend_not_configured' });

  const sql = neon(databaseUrl);
  const rows = await sql`
    select
      f.file_name,
      f.content_type,
      f.size_bytes,
      f.sha256,
      encode(f.content, 'base64') as base64
    from one_driver_document_files f
    join one_driver_documents d on d.id = f.document_id
    where f.document_id = ${parsed.data.documentId}
    limit 1
  `;

  if (!rows[0]) return res.status(404).json({ error: 'document_file_not_found' });

  res.setHeader('Cache-Control', 'private, no-store');
  return res.status(200).json(rows[0]);
}
