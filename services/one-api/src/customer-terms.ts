import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { neon } from '@neondatabase/serverless';
import type { VercelRequest } from '@vercel/node';
import { customerTermsDocuments } from './customer-terms-document.js';

export const customerTerms = {
  version: 'customer-2026-11-01',
  sha256: createHash('sha256').update(JSON.stringify(customerTermsDocuments)).digest('hex'),
  documents: customerTermsDocuments,
};
export function acceptsCurrentCustomerTerms(value: unknown) {
  const v = value as { accepted?: unknown; version?: unknown; sha256?: unknown } | null;
  return !!v && v.accepted === true && v.version === customerTerms.version && v.sha256 === customerTerms.sha256;
}
export function acceptanceNetworkIp(req: VercelRequest, onVercel = process.env.VERCEL === '1') {
  const header = req.headers['x-forwarded-for'];
  const value = onVercel && typeof header === 'string' ? header.split(',')[0].trim() : req.socket?.remoteAddress;
  return value && isIP(value) ? value : null;
}
export async function getCustomerAcceptance(userId: string) {
  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`select accepted_at from one_customer_terms_acceptances
    where user_id = ${userId} and document_sha256 = ${customerTerms.sha256} limit 1`;
  return { accepted: !!rows[0], acceptedAt: rows[0]?.accepted_at ?? null, version: customerTerms.version, sha256: customerTerms.sha256 };
}
