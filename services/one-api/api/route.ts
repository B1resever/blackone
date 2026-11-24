import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { computeRoute } from '../src/maps.js';
import { scheduledRideInstant } from '../src/scheduled-rides.js';
import { getMapsServerKey } from '../src/maps-config.js';

const schema = z.object({
  pickup: z.string().trim().min(3).max(500),
  dropoff: z.string().trim().min(3).max(500),
  vip: z.boolean().optional(),
  pickupDate: z.string().optional(),
  pickupTime: z.string().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_request' });

  if (!getMapsServerKey()) {
    return res.status(503).json({ error: 'maps_not_configured' });
  }

  try {
    const input=parsed.data;
    const departure=input.pickupDate && input.pickupTime ? scheduledRideInstant(input.pickupDate,input.pickupTime,'south-florida') : null;
    const route = await computeRoute(input.pickup,input.dropoff,{ departureTime: departure && departure>Date.now() ? new Date(departure).toISOString() : undefined, tolls: input.vip===true && process.env.B1_VIP_TOLL_ESTIMATES_ENABLED==='true' });
    return res.status(200).json(route);
  } catch (error) {
    console.error('ONE route failed', error);
    return res.status(502).json({ error: 'route_failed' });
  }
}
