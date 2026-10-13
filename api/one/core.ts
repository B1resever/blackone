import type { VercelRequest, VercelResponse } from '@vercel/node';
import health from '../../services/one-api/api/health.js';
import readiness from '../../services/one-api/api/readiness.js';
import markets from '../../services/one-api/api/markets.js';

type Handler = (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>;
const handlers: Record<string, Handler> = {
  'health': health,
  'readiness': readiness,
  'markets': markets,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const raw = Array.isArray(req.query.endpoint) ? req.query.endpoint[0] : req.query.endpoint;
  const endpoint = typeof raw === 'string' ? raw : '';
  const selected = handlers[endpoint];
  if (!selected) return res.status(404).json({ error: 'one_endpoint_not_found', endpoint: endpoint || null });
  return selected(req, res);
}
