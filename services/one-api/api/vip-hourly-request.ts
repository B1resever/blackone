import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { computeRoute } from '../src/maps.js';
import {
  createVipHourlyRequestStore, processVipHourlyRequest, vipHourlyRequestConfig, vipHourlyRequestSchemaAvailable,
} from '../src/vip-hourly-requests.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (allowCors(req, res)) return;
  if (req.method !== 'GET' && req.method !== 'POST') return methodNotAllowed(res, ['GET', 'POST']);
  const config = vipHourlyRequestConfig(process.env);
  if (req.method === 'GET') {
    return res.status(200).json({ enabled: !!config && await vipHourlyRequestSchemaAvailable(config.databaseUrl) });
  }
  const unavailable = { error: 'vip_hourly_unavailable' };
  if (!config) return res.status(503).json(unavailable);

  try {
    const result = await processVipHourlyRequest(req.body, {
      store: createVipHourlyRequestStore(neon(config.databaseUrl)),
      route: computeRoute,
      maximumCalls: config.maximumCalls,
      now: Date.now,
    });
    return res.status(result.statusCode).json(result.body);
  } catch {
    console.error('B1 VIP hourly request storage or pricing unavailable');
    return res.status(503).json(unavailable);
  }
}
