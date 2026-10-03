import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowCors, methodNotAllowed } from '../src/http.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  return res.status(200).json({
    service: 'ONE API',
    status: 'ok',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
}
