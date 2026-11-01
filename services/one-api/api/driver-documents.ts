import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { documentUploadSchema } from '../src/document-upload.js';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { getSessionUser } from '../src/auth.js';
import { validEvidenceUrl, hasCurrentDocumentEvidence, REQUIRED_DRIVER_DOCUMENTS } from '../src/document-validity.js';
import { recalculateDriverCompliance } from '../src/compliance.js';

const schema = z.object({
  documentType: z.enum(['driver_license','insurance','vehicle_registration','background_check','profile_photo','other']),
  fileUpload: documentUploadSchema.optional(),
  documentNumber: z.string().trim().max(120).default(''),
  fileUrl: z.string().max(2000).refine(validEvidenceUrl, 'A secure HTTPS evidence URL is required').optional(),
  expiresOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).superRefine((value, ctx) => {
  if (value.fileUpload && (REQUIRED_DRIVER_DOCUMENTS as readonly string[]).includes(value.documentType) && !hasCurrentDocumentEvidence({expires_on:value.expiresOn,file_url:'https://b1reserve.com'})) ctx.addIssue({code:'custom',path:['expiresOn'],message:'A valid current expiration date is required.'});
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
  const documentId = randomUUID();
  const evidenceUrl = input.fileUpload
    ? 'https://b1reserve.com/one/api/driver-document-file?id=' + documentId
    : input.fileUrl ?? null;
  const statements = [sql`
    insert into one_driver_documents (id, driver_user_id, document_type, document_number, file_url, expires_on, status)
    values (${documentId}, ${user.id}, ${input.documentType}, ${input.documentNumber || null}, ${evidenceUrl}, ${input.expiresOn ?? null}, 'pending')
    returning id, document_type, status, created_at
  `];
  if (input.fileUpload) statements.push(sql`
    insert into one_driver_document_files (document_id, mime_type, contents)
    values (${documentId}, ${input.fileUpload.mimeType}, decode(${input.fileUpload.base64}, 'base64'))
  `);
  try {
    const results = await sql.transaction(statements);
    await recalculateDriverCompliance(user.id);
    return res.status(201).json({ document: results[0][0] });
  } catch {
    // Never log uploaded image bytes or document identifiers.
    return res.status(503).json({ error: 'document_storage_unavailable' });
  }
}
