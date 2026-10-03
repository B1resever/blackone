import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { isAdminAuthorized } from '../src/admin-auth.js';
import { recalculateDriverCompliance } from '../src/compliance.js';
import { sendPushToUser } from '../src/notifications.js';

const schema = z.object({
  documentId: z.string().uuid(),
  status: z.enum(['approved','rejected']),
  reviewNotes: z.string().trim().max(2000).default(''),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (!['GET','POST'].includes(req.method ?? '')) return methodNotAllowed(res, ['GET','POST']);
  if (!isAdminAuthorized(req)) return res.status(401).json({ error: 'unauthorized' });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return res.status(503).json({ error: 'backend_not_configured' });
  const sql = neon(databaseUrl);

  if (req.method === 'GET') {
    const rows = await sql`
      select
        d.id,
        d.driver_user_id,
        u.full_name,
        u.email,
        d.document_type,
        d.document_number,
        d.file_url,
        d.expires_on,
        d.status,
        d.review_notes,
        d.verified_at,
        d.created_at
      from one_driver_documents d
      join one_users u on u.id = d.driver_user_id
      order by
        case when d.status = 'pending' then 0 else 1 end,
        d.created_at desc
      limit 500
    `;
    return res.status(200).json({ documents: rows });
  }

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_request' });

  const rows = await sql`
    update one_driver_documents
    set status = ${parsed.data.status},
        review_notes = ${parsed.data.reviewNotes || null},
        verified_at = case when ${parsed.data.status} = 'approved' then now() else null end,
        updated_at = now()
    where id = ${parsed.data.documentId}
    returning driver_user_id, id, document_type, status
  `;

  if (!rows[0]) return res.status(404).json({ error: 'document_not_found' });

  const driverUserId = String(rows[0].driver_user_id);
  const complianceStatus = await recalculateDriverCompliance(driverUserId);

  await sendPushToUser(
    driverUserId,
    parsed.data.status === 'approved' ? 'ONE document approved' : 'ONE document needs attention',
    parsed.data.status === 'approved'
      ? String(rows[0].document_type).replaceAll('_', ' ') + ' was approved.'
      : String(rows[0].document_type).replaceAll('_', ' ') + ' was not approved. Open ONE Driver for details.',
    { url: '/driver-access', documentType: String(rows[0].document_type), status: parsed.data.status },
  );

  if (complianceStatus === 'approved') {
    await sendPushToUser(
      driverUserId,
      'ONE driver compliance complete',
      'All required documents are approved. You can now set yourself Available for assignments.',
      { url: '/driver-access', complianceStatus },
    );
  }

  return res.status(200).json({ document: rows[0], complianceStatus });
}
