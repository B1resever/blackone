import type { VercelRequest, VercelResponse } from '@vercel/node';
import driverApplications from '../../services/one-api/api/driver-applications.js';
import driverActivate from '../../services/one-api/api/driver-activate.js';
import driverAvailability from '../../services/one-api/api/driver-availability.js';
import driverDocuments from '../../services/one-api/api/driver-documents.js';
import driverFees from '../../services/one-api/api/driver-fees.js';
import driverJobs from '../../services/one-api/api/driver-jobs.js';
import driverTripUpdate from '../../services/one-api/api/driver-trip-update.js';
import driverVerifyRideCode from '../../services/one-api/api/driver-verify-ride-code.js';

type Handler = (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>;
const handlers: Record<string, Handler> = {
  'driver-applications': driverApplications,
  'driver-activate': driverActivate,
  'driver-availability': driverAvailability,
  'driver-documents': driverDocuments,
  'driver-fees': driverFees,
  'driver-jobs': driverJobs,
  'driver-trip-update': driverTripUpdate,
  'driver-verify-ride-code': driverVerifyRideCode,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const raw = Array.isArray(req.query.endpoint) ? req.query.endpoint[0] : req.query.endpoint;
  const endpoint = typeof raw === 'string' ? raw : '';
  const selected = handlers[endpoint];
  if (!selected) return res.status(404).json({ error: 'one_endpoint_not_found', endpoint: endpoint || null });
  return selected(req, res);
}
