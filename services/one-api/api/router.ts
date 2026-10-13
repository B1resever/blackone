import type { VercelRequest, VercelResponse } from '@vercel/node';

type Handler = (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>;
type HandlerModule = { default: Handler };

const handlers: Record<string, () => Promise<HandlerModule>> = {
  'admin-bootstrap': () => import('./admin-bootstrap.js'),
  'admin-driver-application-update': () => import('./admin-driver-application-update.js'),
  'admin-driver-applications': () => import('./admin-driver-applications.js'),
  'admin-driver-documents': () => import('./admin-driver-documents.js'),
  'admin-driver-fees': () => import('./admin-driver-fees.js'),
  'admin-drivers': () => import('./admin-drivers.js'),
  'admin-rates': () => import('./admin-rates.js'),
  'admin-refund': () => import('./admin-refund.js'),
  'admin-reservation-update': () => import('./admin-reservation-update.js'),
  'admin-reservations': () => import('./admin-reservations.js'),
  'admin-review-bootstrap': () => import('./admin-review-bootstrap.js'),
  'admin-user-lookup': () => import('./admin-user-lookup.js'),
  'admin-user-reset-password': () => import('./admin-user-reset-password.js'),
  'auth-delete-account': () => import('./auth-delete-account.js'),
  'auth-login': () => import('./auth-login.js'),
  'auth-logout': () => import('./auth-logout.js'),
  'auth-me': () => import('./auth-me.js'),
  'auth-register': () => import('./auth-register.js'),
  'cancel-reservation': () => import('./cancel-reservation.js'),
  'claim-reservations': () => import('./claim-reservations.js'),
  'create-checkout-session': () => import('./create-checkout-session.js'),
  'create-payment-intent': () => import('./create-payment-intent.js'),
  'driver-activate': () => import('./driver-activate.js'),
  'driver-applications': () => import('./driver-applications.js'),
  'driver-availability': () => import('./driver-availability.js'),
  'driver-documents': () => import('./driver-documents.js'),
  'driver-fee-checkout': () => import('./driver-fee-checkout.js'),
  'driver-fees': () => import('./driver-fees.js'),
  'driver-jobs': () => import('./driver-jobs.js'),
  'driver-trip-update': () => import('./driver-trip-update.js'),
  'driver-verify-ride-code': () => import('./driver-verify-ride-code.js'),
  'health': () => import('./health.js'),
  'markets': () => import('./markets.js'),
  'my-reservations': () => import('./my-reservations.js'),
  'places': () => import('./places.js'),
  'push-register': () => import('./push-register.js'),
  'quotes': () => import('./quotes.js'),
  'readiness': () => import('./readiness.js'),
  'reservation-status': () => import('./reservation-status.js'),
  'reservations': () => import('./reservations.js'),
  'route': () => import('./route.js'),
  'trip-location': () => import('./trip-location.js'),
  'trip-messages': () => import('./trip-messages.js'),
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const rawEndpoint = Array.isArray(req.query.endpoint) ? req.query.endpoint[0] : req.query.endpoint;
  const endpoint = typeof rawEndpoint === 'string'
    ? rawEndpoint.replace(/^\/+|\/+$/g, '')
    : '';

  const load = handlers[endpoint];
  if (!load) {
    return res.status(404).json({
      error: 'one_endpoint_not_found',
      endpoint: endpoint || null,
    });
  }

  const module = await load();
  return module.default(req, res);
}
