import type { VercelRequest, VercelResponse } from '@vercel/node';

type Aircraft = { id: string; latitude: number; longitude: number; observedAt: string; icao24?: string; registration?: string; aircraftType?: string; originIcao?: string; destinationIcao?: string };
const cache = new Map<string, { expires: number; payload: { source: string; updatedAt: string; flights: Aircraft[] } }>();
const valid = (v: unknown): v is Aircraft => {
  if (!v || typeof v !== 'object') return false;
  const f = v as Partial<Aircraft>;
  return typeof f.id === 'string' && typeof f.latitude === 'number' && Math.abs(f.latitude) <= 90 &&
    typeof f.longitude === 'number' && Math.abs(f.longitude) <= 180 && typeof f.observedAt === 'string';
};
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const upstream = process.env.B1_AVIATION_PROVIDER_URL;
  const token = process.env.B1_AVIATION_PROVIDER_TOKEN;
  if (!upstream || !token) return res.status(503).json({ status: 'unconfigured', message: 'Licensed aviation provider not configured' });
  let url: URL;
  try {
    url = new URL(upstream);
    if (url.protocol !== 'https:') throw new Error('HTTPS required');
  } catch {
    return res.status(503).json({ status: 'unconfigured', message: 'Invalid aviation provider configuration' });
  }
  const cached = cache.get('feed');
  if (cached && cached.expires > Date.now()) return res.status(200).json(cached.payload);
  try {
    const response = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) return res.status(502).json({ error: 'Aviation upstream unavailable' });
    const raw: unknown = await response.json();
    if (!raw || typeof raw !== 'object') throw new Error('Invalid upstream response');
    const data = raw as { source?: unknown; updatedAt?: unknown; flights?: unknown };
    if (typeof data.source !== 'string' || typeof data.updatedAt !== 'string' || !Array.isArray(data.flights) || !data.flights.every(valid)) throw new Error('Invalid aviation schema');
    const payload = { source: data.source, updatedAt: data.updatedAt, flights: data.flights.slice(0, 500) };
    cache.set('feed', { expires: Date.now() + 55000, payload });
    return res.status(200).json(payload);
  } catch {
    return res.status(502).json({ error: 'Verified aviation data temporarily unavailable' });
  }
}
