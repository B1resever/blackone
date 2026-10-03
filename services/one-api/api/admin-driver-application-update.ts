import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { isAdminAuthorized } from '../src/admin-auth.js';

const schema = z.object({
  applicationCode: z.string().trim().min(8).max(64),
  status: z.enum(['submitted','reviewing','approved','rejected','documents_required']),
  reviewNotes: z.string().trim().max(2000).default(''),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  if (!isAdminAuthorized(req)) return res.status(401).json({ error: 'unauthorized' });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return res.status(503).json({ error: 'backend_not_configured' });

  const sql = neon(databaseUrl);
  const rows = await sql`
    update one_driver_applications
    set status = ${parsed.data.status},
        review_notes = ${parsed.data.reviewNotes || null},
        updated_at = now()
    where application_code = ${parsed.data.applicationCode}
    returning application_code, status, review_notes, updated_at
  `;

  if (!rows[0]) return res.status(404).json({ error: 'application_not_found' });
  return res.status(200).json({ application: rows[0] });
}
