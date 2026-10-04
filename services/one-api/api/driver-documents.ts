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
      select
        d.id,
        d.document_type,
        d.document_number,
        d.file_url,
        d.expires_on,
        d.status,
        d.review_notes,
        d.verified_at,
        d.created_at,
        d.updated_at,
        f.file_name,
        f.content_type,
        f.size_bytes,
        (f.document_id is not null) as has_file
      from one_driver_documents d
      left join one_driver_document_files f on f.document_id = d.id
      where d.driver_user_id = ${user.id}
      order by d.document_type, d.created_at desc
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
