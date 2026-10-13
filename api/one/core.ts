import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

function applyCors(req: VercelRequest, res: VercelResponse) {
  const configured = (process.env.ONE_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : '';
  if (origin && configured.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const raw = Array.isArray(req.query.endpoint) ? req.query.endpoint[0] : req.query.endpoint;
  const endpoint = typeof raw === 'string' ? raw : '';

  if (endpoint === 'health') {
    return res.status(200).json({
      service: 'ONE API',
      status: 'ok',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    });
  }

  if (endpoint === 'readiness') {
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

  if (endpoint === 'markets') {
    const databaseUrl = process.env.DATABASE_URL?.trim();
    if (!databaseUrl) return res.status(503).json({ error: 'database_not_configured' });

    const sql = neon(databaseUrl);
    const rows = await sql`
      select
        id,
        country_code as "countryCode",
        name,
        currency,
        time_zone as "timeZone",
        active
      from one_markets
      where active = true
      order by case id
        when 'south-florida' then 1
        when 'buenos-aires' then 2
        else 100
      end, name
    `;
    return res.status(200).json({ markets: rows });
  }

  return res.status(404).json({ error: 'one_endpoint_not_found', endpoint: endpoint || null });
}
