import type { TripLocation } from './auth-client';

export const LOCATION_FRESH_MS = 60_000;

export function normalizeTripLocation(value: unknown): TripLocation | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  if (typeof item.latitude !== 'number' || typeof item.longitude !== 'number'
    || !Number.isFinite(item.latitude) || !Number.isFinite(item.longitude)
    || Math.abs(item.latitude) > 90 || Math.abs(item.longitude) > 180
    || typeof item.created_at !== 'string' || !Number.isFinite(Date.parse(item.created_at))) return null;
  return item as TripLocation;
}

export function isTripLocationFresh(location: TripLocation, now = Date.now()) {
  const age = now - Date.parse(location.created_at);
  return age >= -30_000 && age <= LOCATION_FRESH_MS;
}

export function prepareDriverCoordinates(coords: {
  latitude: number; longitude: number; accuracy: number | null;
  heading: number | null; speed: number | null;
}) {
  if (!Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude)
    || Math.abs(coords.latitude) > 90 || Math.abs(coords.longitude) > 180) {
    throw new Error('invalid_location_coordinates');
  }
  const measured = (value: number | null, max: number) =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max ? value : null;
  return {
    latitude: coords.latitude, longitude: coords.longitude,
    accuracyMeters: measured(coords.accuracy, 10_000),
    headingDegrees: measured(coords.heading, 360),
    speedMps: measured(coords.speed, 200),
  };
}
