import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowCors, methodNotAllowed } from '../src/http.js';
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

  const mapsConfigured = Boolean(process.env.GOOGLE_MAPS_SERVER_KEY);

  return res.status(200).json({
    status: mapsConfigured ? 'rate_card_required' : 'manual_confirmation',
    currency: parsed.data.marketId === 'buenos-aires' ? 'ARS' : 'USD',
    amountMinor: null,
    message: 'Final price will be confirmed by BLACK ONE before dispatch.',
  });
}
