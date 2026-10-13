import type { VercelRequest, VercelResponse } from '@vercel/node';
import tripLocation from '../../services/one-api/api/trip-location.js';
import tripMessages from '../../services/one-api/api/trip-messages.js';
import pushRegister from '../../services/one-api/api/push-register.js';

type Handler = (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>;
const handlers: Record<string, Handler> = {
  'trip-location': tripLocation,
  'trip-messages': tripMessages,
  'push-register': pushRegister,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const raw = Array.isArray(req.query.endpoint) ? req.query.endpoint[0] : req.query.endpoint;
  const endpoint = typeof raw === 'string' ? raw : '';
  const selected = handlers[endpoint];
  if (!selected) return res.status(404).json({ error: 'one_endpoint_not_found', endpoint: endpoint || null });
  return selected(req, res);
}
