export const REQUIRED_DRIVER_DOCUMENTS = ['driver_license', 'insurance', 'vehicle_registration', 'background_check'] as const;

export function validEvidenceUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password;
  } catch { return false; }
}

// This is an evidence gate, not an insurance-coverage or background-screening certification.
export function hasCurrentDocumentEvidence(row: { expires_on?: unknown; file_url?: unknown }, now = new Date()): boolean {
  const date = String(row.expires_on ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !validEvidenceUrl(row.file_url)) return false;
  const parsed = new Date(date + 'T00:00:00Z');
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return false;
  return date >= now.toISOString().slice(0, 10);
}
