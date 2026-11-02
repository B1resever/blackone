/** Licensed B1 aviation feed contract. Never place vendor API keys in the mobile app. */
export type AviationFlight = {
  id: string;
  latitude: number;
  longitude: number;
  icao24?: string;
  registration?: string;
  aircraftType?: string;
  originIcao?: string;
  destinationIcao?: string;
  observedAt: string;
};
export type AviationFeed = {
  source: string;
  updatedAt: string;
  flights: AviationFlight[];
};
export type AviationFeedResult =
  | { status: 'ready'; feed: AviationFeed }
  | { status: 'stale'; updatedAt: string }
  | { status: 'unconfigured' }
  | { status: 'unavailable'; message: string };

function isFlight(value: unknown): value is AviationFlight {
  if (!value || typeof value !== 'object') return false;
  const f = value as Partial<AviationFlight>;
  return typeof f.id === 'string' &&
    typeof f.latitude === 'number' && Number.isFinite(f.latitude) && Math.abs(f.latitude) <= 90 &&
    typeof f.longitude === 'number' && Number.isFinite(f.longitude) && Math.abs(f.longitude) <= 180 &&
    typeof f.observedAt === 'string';
}

/** B1 server endpoint only; do not configure a third-party vendor endpoint here. */
export async function fetchAviationFeed(endpoint: string | undefined, signal?: AbortSignal): Promise<AviationFeedResult> {
  if (!endpoint) return { status: 'unconfigured' };
  let url: URL;
  try {
    url = new URL(endpoint);
    if (url.protocol !== 'https:') return { status: 'unavailable', message: 'Secure HTTPS endpoint required.' };
  } catch {
    return { status: 'unavailable', message: 'Invalid aviation feed URL.' };
  }
  try {
    const response = await fetch(url.toString(), { signal, headers: { Accept: 'application/json' } });
    if (!response.ok) return { status: 'unavailable', message: 'Aviation data is temporarily unavailable.' };
    const data: unknown = await response.json();
    if (!data || typeof data !== 'object') throw new Error('Invalid feed');
    const feed = data as Partial<AviationFeed>;
    if (typeof feed.source !== 'string' || typeof feed.updatedAt !== 'string' || !Array.isArray(feed.flights) || !feed.flights.every(isFlight)) throw new Error('Invalid feed');
    const updated = Date.parse(feed.updatedAt);
    if (!Number.isFinite(updated) || updated > Date.now() + 60000 || Date.now() - updated > 5 * 60000) return { status: 'stale', updatedAt: feed.updatedAt };
    return { status: 'ready', feed: { source: feed.source, updatedAt: feed.updatedAt, flights: feed.flights } };
  } catch {
    return { status: 'unavailable', message: 'Could not load verified aviation positions.' };
  }
}
