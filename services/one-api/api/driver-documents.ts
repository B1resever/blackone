import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { getSessionUser } from '../src/auth.js';
import { recalculateDriverCompliance } from '../src/compliance.js';

const schema = z.object({
  documentType: z.enum(['driver_license','insurance','vehicle_registration','background_check','profile_photo','other']),
  documentNumber: z.string().trim().max(120).default(''),
  fileUrl: z.string().url().max(2000).optional(),
  expiresOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (!['GET','POST'].includes(req.method ?? '')) return methodNotAllowed(res, ['GET','POST']);

  const user = await getSessionUser(req);
  if (!user || user.role !== 'driver') return res.status(401).json({ error: 'driver_unauthorized' });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return res.status(503).json({ error: 'backend_not_configured' });

  const sql = neon(databaseUrl);

  if (req.method === 'GET') {
    const rows = await sql`
      select id, document_type, document_number, file_url, expires_on, status, review_notes, verified_at, created_at, updated_at
      from one_driver_documents
      where driver_user_id = ${user.id}
      order by document_type, created_at desc
    `;
    return res.status(200).json({ documents: rows });
  }

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });

  const input = parsed.data;
  const rows = await sql`
    insert into one_driver_documents (
      driver_user_id,
      document_type,
      document_number,
      file_url,
      expires_on,
      status
    ) values (
      ${user.id},
      ${input.documentType},
      ${input.documentNumber || null},
      ${input.fileUrl ?? null},
      ${input.expiresOn ?? null},
      'pending'
    )
    returning id, document_type, status, created_at
  `;

  await recalculateDriverCompliance(user.id);

  return res.status(201).json({ document: rows[0] });
}
