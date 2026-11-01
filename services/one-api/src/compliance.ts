import { neon } from '@neondatabase/serverless';

import { REQUIRED_DRIVER_DOCUMENTS, hasCurrentDocumentEvidence, validEvidenceUrl } from './document-validity.js';

export async function recalculateDriverCompliance(driverUserId: string) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is not configured');

  const sql = neon(databaseUrl);
  const rows = await sql`
    select distinct on (document_type)
      document_type,
      status,
      document_number,
      expires_on::text as expires_on,
      file_url
    from one_driver_documents
    where driver_user_id = ${driverUserId}
      and (document_type in ('driver_license','insurance','vehicle_registration','background_check') or (document_type = 'other' and document_number = 'vehicle_photo'))
    order by document_type, created_at desc, id desc
  `;

  const latest = new Map(rows.map((row) => [String(row.document_type), row]));
  const now = new Date();
  const valid = REQUIRED_DRIVER_DOCUMENTS.every((type) => {
    const row = latest.get(type);
    return row?.status === 'approved' && hasCurrentDocumentEvidence(row, now);
  });

  const photo = latest.get('other');
  const photoValid = photo?.status === 'approved' && validEvidenceUrl(photo.file_url);
  const complianceStatus = valid && photoValid ? 'approved' : 'pending';

  await sql`
    update one_driver_profiles
    set compliance_status = ${complianceStatus},
        compliance_checked_at = now(),
        available_for_assignment = case when ${complianceStatus} = 'approved' then available_for_assignment else false end,
        updated_at = now()
    where user_id = ${driverUserId}
  `;

  return complianceStatus;
}
