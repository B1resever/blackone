import type { VercelRequest, VercelResponse } from '@vercel/node';

import adminBootstrap from './admin-bootstrap.js';
import adminDriverApplicationUpdate from './admin-driver-application-update.js';
import adminDriverApplications from './admin-driver-applications.js';
import adminDriverDocuments from './admin-driver-documents.js';
import adminDriverFees from './admin-driver-fees.js';
import adminDrivers from './admin-drivers.js';
import adminRates from './admin-rates.js';
import adminRefund from './admin-refund.js';
import adminReservationUpdate from './admin-reservation-update.js';
import adminReservations from './admin-reservations.js';
import adminReviewBootstrap from './admin-review-bootstrap.js';
import adminUserLookup from './admin-user-lookup.js';
import adminUserResetPassword from './admin-user-reset-password.js';
import authDeleteAccount from './auth-delete-account.js';
import authLogin from './auth-login.js';
import authLogout from './auth-logout.js';
import authMe from './auth-me.js';
import authRegister from './auth-register.js';
import cancelReservation from './cancel-reservation.js';
import claimReservations from './claim-reservations.js';
import createCheckoutSession from './create-checkout-session.js';
import createPaymentIntent from './create-payment-intent.js';
import driverActivate from './driver-activate.js';
import driverApplications from './driver-applications.js';
import driverAvailability from './driver-availability.js';
import driverDocuments from './driver-documents.js';
import driverFeeCheckout from './driver-fee-checkout.js';
import driverFees from './driver-fees.js';
import driverJobs from './driver-jobs.js';
import driverTripUpdate from './driver-trip-update.js';
import driverVerifyRideCode from './driver-verify-ride-code.js';
import health from './health.js';
import markets from './markets.js';
import myReservations from './my-reservations.js';
import places from './places.js';
import pushRegister from './push-register.js';
import quotes from './quotes.js';
import readiness from './readiness.js';
import reservationStatus from './reservation-status.js';
import reservations from './reservations.js';
import route from './route.js';
import tripLocation from './trip-location.js';
import tripMessages from './trip-messages.js';

type Handler = (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>;

const handlers: Record<string, Handler> = {
  'admin-bootstrap': adminBootstrap,
  'admin-driver-application-update': adminDriverApplicationUpdate,
  'admin-driver-applications': adminDriverApplications,
  'admin-driver-documents': adminDriverDocuments,
  'admin-driver-fees': adminDriverFees,
  'admin-drivers': adminDrivers,
  'admin-rates': adminRates,
  'admin-refund': adminRefund,
  'admin-reservation-update': adminReservationUpdate,
  'admin-reservations': adminReservations,
  'admin-review-bootstrap': adminReviewBootstrap,
  'admin-user-lookup': adminUserLookup,
  'admin-user-reset-password': adminUserResetPassword,
  'auth-delete-account': authDeleteAccount,
  'auth-login': authLogin,
  'auth-logout': authLogout,
  'auth-me': authMe,
  'auth-register': authRegister,
  'cancel-reservation': cancelReservation,
  'claim-reservations': claimReservations,
  'create-checkout-session': createCheckoutSession,
  'create-payment-intent': createPaymentIntent,
  'driver-activate': driverActivate,
  'driver-applications': driverApplications,
  'driver-availability': driverAvailability,
  'driver-documents': driverDocuments,
  'driver-fee-checkout': driverFeeCheckout,
  'driver-fees': driverFees,
  'driver-jobs': driverJobs,
  'driver-trip-update': driverTripUpdate,
  'driver-verify-ride-code': driverVerifyRideCode,
  health,
  markets,
  'my-reservations': myReservations,
  places,
  'push-register': pushRegister,
  quotes,
  readiness,
  'reservation-status': reservationStatus,
  reservations,
  route,
  'trip-location': tripLocation,
  'trip-messages': tripMessages,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const rawEndpoint = Array.isArray(req.query.endpoint) ? req.query.endpoint[0] : req.query.endpoint;
  const endpoint = typeof rawEndpoint === 'string'
    ? rawEndpoint.replace(/^\/+|\/+$/g, '')
    : '';

  const selected = handlers[endpoint];
  if (!selected) {
    return res.status(404).json({
      error: 'one_endpoint_not_found',
      endpoint: endpoint || null,
    });
  }

  return selected(req, res);
}
