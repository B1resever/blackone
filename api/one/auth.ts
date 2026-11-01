import type { VercelRequest, VercelResponse } from '@vercel/node';
import authRegister from '../../services/one-api/api/auth-register.js';
import authLogin from '../../services/one-api/api/auth-login.js';
import authLogout from '../../services/one-api/api/auth-logout.js';
import authMe from '../../services/one-api/api/auth-me.js';
import authDeleteAccount from '../../services/one-api/api/auth-delete-account.js';
import customerTerms from '../../services/one-api/api/customer-terms.js';

type Handler = (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>;
const handlers: Record<string, Handler> = {
  'customer-terms': customerTerms,
  'auth-register': authRegister,
  'auth-login': authLogin,
  'auth-logout': authLogout,
  'auth-me': authMe,
  'auth-delete-account': authDeleteAccount,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const raw = Array.isArray(req.query.endpoint) ? req.query.endpoint[0] : req.query.endpoint;
  const endpoint = typeof raw === 'string' ? raw : '';
  const selected = handlers[endpoint];
  if (!selected) return res.status(404).json({ error: 'one_endpoint_not_found', endpoint: endpoint || null });
  return selected(req, res);
}
