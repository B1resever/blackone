import type { VercelRequest, VercelResponse } from '@vercel/node';

export function allowCors(req: VercelRequest, res: VercelResponse) {
  const configured = (process.env.ONE_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : '';
  if (origin && configured.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

export function methodNotAllowed(res: VercelResponse, allowed: string[]) {
  res.setHeader('Allow', allowed.join(', '));
  return res.status(405).json({ error: 'method_not_allowed' });
}
