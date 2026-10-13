import type { VercelRequest, VercelResponse } from '@vercel/node';
import createCheckoutSession from '../../services/one-api/api/create-checkout-session.js';
import createPaymentIntent from '../../services/one-api/api/create-payment-intent.js';
import driverFeeCheckout from '../../services/one-api/api/driver-fee-checkout.js';

type Handler = (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>;
const handlers: Record<string, Handler> = {
  'create-checkout-session': createCheckoutSession,
  'create-payment-intent': createPaymentIntent,
  'driver-fee-checkout': driverFeeCheckout,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const raw = Array.isArray(req.query.endpoint) ? req.query.endpoint[0] : req.query.endpoint;
  const endpoint = typeof raw === 'string' ? raw : '';
  const selected = handlers[endpoint];
  if (!selected) return res.status(404).json({ error: 'one_endpoint_not_found', endpoint: endpoint || null });
  return selected(req, res);
}
