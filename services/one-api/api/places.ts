import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { autocompletePlaces } from '../src/maps.js';

const schema = z.object({
  input: z.string().trim().min(3).max(200),
  marketId: z.enum(['south-florida', 'buenos-aires']),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_request' });

  if (!process.env.GOOGLE_MAPS_SERVER_KEY) {
    return res.status(503).json({ error: 'maps_not_configured', suggestions: [] });
  }

  try {
    const regionCode = parsed.data.marketId === 'buenos-aires' ? 'AR' : 'US';
    const suggestions = await autocompletePlaces(parsed.data.input, regionCode);
    return res.status(200).json({ suggestions });
  } catch (error) {
    console.error('ONE place autocomplete failed', error);
    return res.status(502).json({ error: 'places_failed', suggestions: [] });
  }
}
