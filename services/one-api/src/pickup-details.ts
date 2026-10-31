import { z } from 'zod';

export const pickupDetailsShape = {
  airportPickup: z.boolean().default(false),
  flightNumber: z.string().trim().max(20).regex(/^[a-zA-Z0-9 -]*$/).default(''),
  pickupMeeting: z.enum(['curbside', 'meet-and-greet']).default('curbside'),
  pickupInstructions: z.string().trim().max(500).default(''),
};
const schema = z.object(pickupDetailsShape);

export function pickupDetails(input: unknown) {
  const parsed = schema.safeParse(input);
  return parsed.success && parsed.data.airportPickup
    ? { ...parsed.data, flightNumber: parsed.data.flightNumber.toUpperCase() } : null;
}

export function reservationWithPickupDetails<T extends { notes?: unknown }>(row: T) {
  const { notes, ...reservation } = row;
  let parsed: unknown = notes;
  if (typeof notes === 'string') {
    try { parsed = JSON.parse(notes); } catch { parsed = null; }
  }
  return { ...reservation, pickup_details: pickupDetails(parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>).pickupDetails : null) };
}

export function requiresPickupConfirmation(input: unknown): boolean {
  return pickupDetails(input)?.pickupMeeting === 'meet-and-greet';
}
