import type { VercelRequest, VercelResponse } from '@vercel/node';
import adminBootstrap from '../../services/one-api/api/admin-bootstrap.js';
import adminReviewBootstrap from '../../services/one-api/api/admin-review-bootstrap.js';
import adminUserLookup from '../../services/one-api/api/admin-user-lookup.js';
import adminUserResetPassword from '../../services/one-api/api/admin-user-reset-password.js';

type Handler = (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>;
const handlers: Record<string, Handler> = {
  'admin-bootstrap': adminBootstrap,
  'admin-review-bootstrap': adminReviewBootstrap,
  'admin-user-lookup': adminUserLookup,
  'admin-user-reset-password': adminUserResetPassword,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const raw = Array.isArray(req.query.endpoint) ? req.query.endpoint[0] : req.query.endpoint;
  const endpoint = typeof raw === 'string' ? raw : '';
  const selected = handlers[endpoint];
  if (!selected) return res.status(404).json({ error: 'one_endpoint_not_found', endpoint: endpoint || null });
  return selected(req, res);
}
