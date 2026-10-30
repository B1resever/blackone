import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { getReadiness } from '../src/readiness.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  const readiness = await getReadiness();
  return res.status(readiness.ready ? 200 : 503).json(readiness);
}
