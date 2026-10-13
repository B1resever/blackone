import type { VercelRequest, VercelResponse } from '@vercel/node';
import adminDriverApplications from '../../services/one-api/api/admin-driver-applications.js';
import adminDriverApplicationUpdate from '../../services/one-api/api/admin-driver-application-update.js';
import adminDriverDocuments from '../../services/one-api/api/admin-driver-documents.js';
import adminDriverFees from '../../services/one-api/api/admin-driver-fees.js';
import adminDrivers from '../../services/one-api/api/admin-drivers.js';

type Handler = (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>;
const handlers: Record<string, Handler> = {
  'admin-driver-applications': adminDriverApplications,
  'admin-driver-application-update': adminDriverApplicationUpdate,
  'admin-driver-documents': adminDriverDocuments,
  'admin-driver-fees': adminDriverFees,
  'admin-drivers': adminDrivers,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const raw = Array.isArray(req.query.endpoint) ? req.query.endpoint[0] : req.query.endpoint;
  const endpoint = typeof raw === 'string' ? raw : '';
  const selected = handlers[endpoint];
  if (!selected) return res.status(404).json({ error: 'one_endpoint_not_found', endpoint: endpoint || null });
  return selected(req, res);
}
