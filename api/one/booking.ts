import type { VercelRequest, VercelResponse } from '@vercel/node';
import places from '../../services/one-api/api/places.js';
import route from '../../services/one-api/api/route.js';
import quotes from '../../services/one-api/api/quotes.js';
import reservations from '../../services/one-api/api/reservations.js';
import reservationStatus from '../../services/one-api/api/reservation-status.js';
import cancelReservation from '../../services/one-api/api/cancel-reservation.js';
import claimReservations from '../../services/one-api/api/claim-reservations.js';
import myReservations from '../../services/one-api/api/my-reservations.js';

type Handler = (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>;
const handlers: Record<string, Handler> = {
  'places': places,
  'route': route,
  'quotes': quotes,
  'reservations': reservations,
  'reservation-status': reservationStatus,
  'cancel-reservation': cancelReservation,
  'claim-reservations': claimReservations,
  'my-reservations': myReservations,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const raw = Array.isArray(req.query.endpoint) ? req.query.endpoint[0] : req.query.endpoint;
  const endpoint = typeof raw === 'string' ? raw : '';
  const selected = handlers[endpoint];
  if (!selected) return res.status(404).json({ error: 'one_endpoint_not_found', endpoint: endpoint || null });
  return selected(req, res);
}
