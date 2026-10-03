import { neon } from '@neondatabase/serverless';

const REQUIRED_DOCUMENTS = [
  'driver_license',
  'insurance',
  'vehicle_registration',
  'background_check',
] as const;

export async function recalculateDriverCompliance(driverUserId: string) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is not configured');

  const sql = neon(databaseUrl);
  const rows = await sql`
    select distinct on (document_type)
      document_type,
      status,
      expires_on
    from one_driver_documents
    where driver_user_id = ${driverUserId}
      and document_type = any(${REQUIRED_DOCUMENTS})
    order by document_type, created_at desc
  `;

  const latest = new Map(rows.map((row) => [String(row.document_type), row]));
  const now = new Date();
  const valid = REQUIRED_DOCUMENTS.every((type) => {
    const row = latest.get(type);
    if (!row || row.status !== 'approved') return false;
    if (!row.expires_on) return true;
    return new Date(String(row.expires_on) + 'T23:59:59Z').getTime() >= now.getTime();
  });

  const complianceStatus = valid ? 'approved' : 'pending';

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
