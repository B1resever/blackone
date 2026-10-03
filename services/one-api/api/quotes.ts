import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { computeRoute } from '../src/maps.js';
import { calculateQuote } from '../src/pricing.js';
import { quoteRequestSchema } from '../src/validation.js';

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
  let route;

  if (input.rideType !== 'hourly') {
    if (!process.env.GOOGLE_MAPS_SERVER_KEY) {
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
      console.error('ONE quote route failed', error);
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
    route,
  });

  return res.status(200).json({
    ...quote,
    message:
      quote.status === 'quoted'
        ? 'Estimated fare calculated from the active ONE market rate card.'
        : 'Final price will be confirmed by BLACK ONE before dispatch.',
  });
}
