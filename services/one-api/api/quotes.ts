import { requiresPickupConfirmation } from '../src/pickup-details.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { computeRoute } from '../src/maps.js';
import { getMapsServerKey } from '../src/maps-config.js';
import { calculateQuote } from '../src/pricing.js';
import { quoteRequestSchema } from '../src/validation.js';
import { scheduledRideInstant } from '../src/scheduled-rides.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const parsed = quoteRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'invalid_request',
      details: parsed.error.flatten(),
    });
  }

  const input = parsed.data;
  if (requiresPickupConfirmation(input)) return res.status(200).json({
    status: 'manual_confirmation', amountMinor: null,
    currency: input.marketId === 'buenos-aires' ? 'ARS' : 'USD',
    message: 'B1 must confirm the requested vehicle, pickup arrangements and final fare before payment.',
  });
  let route;

  if (input.rideType !== 'hourly') {
    if (!getMapsServerKey()) {
      return res.status(200).json({
        status: 'manual_confirmation',
        currency: input.marketId === 'buenos-aires' ? 'ARS' : 'USD',
        amountMinor: null,
        distanceMeters: null,
        durationSeconds: null,
        message: 'Route pricing will be confirmed by BLACK ONE before dispatch.',
      });
    }

    try {
      route = await computeRoute(input.pickup, input.dropoff);
    } catch (error) {
      console.error('ONE quote route failed');
      return res.status(200).json({
        status: 'manual_confirmation',
        currency: input.marketId === 'buenos-aires' ? 'ARS' : 'USD',
        amountMinor: null,
        distanceMeters: null,
        durationSeconds: null,
        message: 'Route pricing requires manual confirmation.',
      });
    }
  }

  const quote = await calculateQuote({
    marketId: input.marketId,
    vehicleClass: input.vehicleClass,
    rideType: input.rideType,
    hourlyHours: input.hourlyHours,
    pickupAt: scheduledRideInstant(input.pickupDate, input.pickupTime, input.marketId),
    route,
  });

  return res.status(200).json({
    ...quote,
    message:
      quote.status === 'quoted'
        ? 'Estimated fare calculated from the active B1 customer pricing configuration.'
        : 'Final price will be confirmed by BLACK ONE before dispatch.',
  });
}
