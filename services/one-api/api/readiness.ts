import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowCors, methodNotAllowed } from '../src/http.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  const integrations = {
    database: Boolean(process.env.DATABASE_URL),
    googleMaps: Boolean(process.env.GOOGLE_MAPS_SERVER_KEY),
    stripe: Boolean(process.env.STRIPE_SECRET_KEY),
    stripeWebhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    adminAuth: Boolean(process.env.ONE_ADMIN_API_TOKEN),
    allowedOrigins: Boolean(process.env.ONE_ALLOWED_ORIGINS),
    paymentSuccessUrl: Boolean(process.env.ONE_PAYMENT_SUCCESS_URL),
    paymentCancelUrl: Boolean(process.env.ONE_PAYMENT_CANCEL_URL),
  };

  const ready = Object.values(integrations).every(Boolean);

  return res.status(ready ? 200 : 503).json({
    service: 'ONE API',
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown',
    ready,
    integrations,
    timestamp: new Date().toISOString(),
  });
}
