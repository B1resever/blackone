import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { getSessionUser } from '../src/auth.js';
import { recalculateDriverCompliance } from '../src/compliance.js';

const MAX_FILE_BYTES = 2_500_000;
const allowedTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
]);

const schema = z.object({
  documentType: z.enum(['driver_license','insurance','vehicle_registration','background_check','profile_photo','other']),
  documentNumber: z.string().trim().max(120).default(''),
  expiresOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fileName: z.string().trim().min(1).max(240),
  contentType: z.string().trim().min(1).max(120),
  base64: z.string().min(4).max(3_500_000),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const user = await getSessionUser(req);
  if (!user || user.role !== 'driver') return res.status(401).json({ error: 'driver_unauthorized' });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });
  }

  const input = parsed.data;
  const contentType = input.contentType.toLowerCase().split(';')[0].trim();
  if (!allowedTypes.has(contentType)) {
    return res.status(415).json({ error: 'unsupported_document_type' });
  }

  let bytes: Buffer;
  try {
    bytes = Buffer.from(input.base64, 'base64');
  } catch {
    return res.status(400).json({ error: 'invalid_document_encoding' });
  }

  if (!bytes.length || bytes.length > MAX_FILE_BYTES) {
    return res.status(413).json({
      error: 'document_too_large',
      maxBytes: MAX_FILE_BYTES,
    });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return res.status(503).json({ error: 'backend_not_configured' });

  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const sql = neon(databaseUrl);

  const rows = await sql`
    with new_document as (
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
        null,
        ${input.expiresOn ?? null},
        'pending'
      )
      returning id, document_type, document_number, expires_on, status, created_at
    ),
    new_file as (
      insert into one_driver_document_files (
        document_id,
        file_name,
        content_type,
        size_bytes,
        sha256,
        content
      )
      select
        id,
        ${input.fileName},
        ${contentType},
        ${bytes.length},
        ${sha256},
        decode(${input.base64}, 'base64')
      from new_document
      returning document_id
    )
    select
      d.id,
      d.document_type,
      d.document_number,
      d.expires_on,
      d.status,
      d.created_at,
      ${input.fileName}::text as file_name,
      ${bytes.length}::integer as size_bytes,
      true as has_file
    from new_document d
    join new_file f on f.document_id = d.id
  `;

  await recalculateDriverCompliance(user.id);

  return res.status(201).json({ document: rows[0] });
}
