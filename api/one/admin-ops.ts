import type { VercelRequest, VercelResponse } from '@vercel/node';
import adminReservations from '../../services/one-api/api/admin-reservations.js';
import adminReservationUpdate from '../../services/one-api/api/admin-reservation-update.js';
import adminRefund from '../../services/one-api/api/admin-refund.js';
import adminRates from '../../services/one-api/api/admin-rates.js';

type Handler = (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>;
const handlers: Record<string, Handler> = {
  'admin-reservations': adminReservations,
  'admin-reservation-update': adminReservationUpdate,
  'admin-refund': adminRefund,
  'admin-rates': adminRates,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const raw = Array.isArray(req.query.endpoint) ? req.query.endpoint[0] : req.query.endpoint;
  const endpoint = typeof raw === 'string' ? raw : '';
  const selected = handlers[endpoint];
  if (!selected) return res.status(404).json({ error: 'one_endpoint_not_found', endpoint: endpoint || null });
  return selected(req, res);
}
