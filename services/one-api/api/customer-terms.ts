import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { getSessionUser } from '../src/auth.js';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { customerTerms, acceptsCurrentCustomerTerms, acceptanceNetworkIp, getCustomerAcceptance } from '../src/customer-terms.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  res.setHeader('Cache-Control', 'private, no-store');
  if (!['GET', 'POST'].includes(req.method ?? '')) return methodNotAllowed(res, ['GET', 'POST']);
  const user = await getSessionUser(req);
  if (req.method === 'GET') return res.status(200).json({ ...customerTerms,
    customerAccount: user?.role === 'passenger',
    acceptance: user ? await getCustomerAcceptance(user.id) : null });
  if (!user) return res.status(401).json({ error: 'unauthorized' });
  if (user.role !== 'passenger') return res.status(403).json({ error: 'customer_account_required' });
  if (!acceptsCurrentCustomerTerms(req.body)) return res.status(409).json({ error: 'current_terms_required', version: customerTerms.version, sha256: customerTerms.sha256 });
  const sql = neon(process.env.DATABASE_URL!);
  // The account and network data come from the authenticated session/server.
  // Retry never overwrites the original time, IP, contact details or documents.
  await sql`insert into one_customer_terms_acceptances
    (user_id, document_version, document_sha256, document_snapshot, account_email, account_phone, network_ip)
    values (${user.id}, ${customerTerms.version}, ${customerTerms.sha256}, ${JSON.stringify(customerTerms.documents)}::jsonb,
      ${user.email}, ${user.phone}, ${acceptanceNetworkIp(req)})
    on conflict (user_id, document_sha256) do nothing`;
  return res.status(200).json({ acceptance: await getCustomerAcceptance(user.id) });
}
