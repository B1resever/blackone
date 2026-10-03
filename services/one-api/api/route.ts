import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { computeRoute } from '../src/maps.js';

const schema = z.object({
  pickup: z.string().trim().min(3).max(500),
  dropoff: z.string().trim().min(3).max(500),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_request' });

  if (!process.env.GOOGLE_MAPS_SERVER_KEY) {
    return res.status(503).json({ error: 'maps_not_configured' });
  }

  try {
    const route = await computeRoute(parsed.data.pickup, parsed.data.dropoff);
    return res.status(200).json(route);
  } catch (error) {
    console.error('ONE route failed', error);
    return res.status(502).json({ error: 'route_failed' });
  }
}
