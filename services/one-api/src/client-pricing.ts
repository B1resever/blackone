import { z } from 'zod';

// Customer prices only. Driver offers and payouts never enter this calculation.
const money = z.number().int().nonnegative().max(100_000_000);
const point = z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) });
const windowSchema = z.object({
  id: z.string().min(1),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
  areaIds: z.array(z.string().min(1)).min(1),
  multiplierBps: z.number().int().min(10_000).max(100_000),
}).refine(w => Date.parse(w.endsAt) > Date.parse(w.startsAt));

export const clientPricingSchema = z.object({
  version: z.string().min(1),
  marketId: z.enum(['south-florida', 'buenos-aires']),
  currency: z.enum(['USD', 'ARS']),
  effectiveFrom: z.string().datetime({ offset: true }),
  effectiveTo: z.string().datetime({ offset: true }),
  areas: z.array(z.union([z.object({
    id: z.string().min(1),
    south: z.number().min(-90).max(90), north: z.number().min(-90).max(90),
    west: z.number().min(-180).max(180), east: z.number().min(-180).max(180),
  }).refine(a => a.north > a.south && a.east > a.west), z.object({
    id: z.string().min(1), center: point, radiusMiles: z.number().positive().max(150),
  })])).min(1),
  rates: z.array(z.object({
    pickupAreaId: z.string().min(1), dropoffAreaId: z.string().min(1),
    vehicleClass: z.enum(['suv-black', 'xl']),
    minimumMinor: money.positive(), baseMinor: money,
    perMileMinor: money, perMinuteMinor: money,
  })).min(1),
  // Events, overnight periods and demand all use explicit, expiring windows.
  adjustments: z.array(windowSchema).default([]),
}).superRefine((card, ctx) => {
  const ids = new Set(card.areas.map(a => a.id));
  const keys = card.rates.map(r => `${r.pickupAreaId}/${r.dropoffAreaId}/${r.vehicleClass}`);
  if (ids.size !== card.areas.length || new Set(keys).size !== keys.length ||
      Date.parse(card.effectiveTo) <= Date.parse(card.effectiveFrom) ||
      card.currency !== (card.marketId === 'south-florida' ? 'USD' : 'ARS') ||
      card.rates.some(r => !ids.has(r.pickupAreaId) || !ids.has(r.dropoffAreaId)) ||
      card.adjustments.some(w => w.areaIds.some(id => !ids.has(id)))) {
    ctx.addIssue({ code: 'custom', message: 'Invalid customer pricing configuration.' });
  }
});

type Point = z.infer<typeof point>;
type ClientPricingInput = {
  marketId: string; vehicleClass: string; rideType: string; pickupAt: number | null;
  distanceMeters?: number; durationSeconds?: number;
  pickupLocation?: Point; dropoffLocation?: Point;
};

// Undefined means the zone engine is not configured. A configured but invalid or
// uncovered trip must NEVER fall back to a cheaper distance-only rate card.
export function calculateClientQuote(raw: string | undefined, input: ClientPricingInput) {
  if (!raw) return undefined;
  const manual = { status: 'manual_confirmation' as const, amountMinor: null,
    currency: input.marketId === 'buenos-aires' ? 'ARS' : 'USD',
    distanceMeters: input.distanceMeters ?? null, durationSeconds: input.durationSeconds ?? null };
  let data: unknown;
  try { data = JSON.parse(raw); } catch { return manual; }
  const parsed = clientPricingSchema.safeParse(data);
  if (!parsed.success) return manual;
  const card = parsed.data;
  const at = input.pickupAt;
  if (card.marketId !== input.marketId || input.rideType !== 'one-way' || at === null ||
      !Number.isFinite(at) || at < Date.parse(card.effectiveFrom) || at >= Date.parse(card.effectiveTo) ||
      !point.safeParse(input.pickupLocation).success || !point.safeParse(input.dropoffLocation).success ||
      !Number.isFinite(input.distanceMeters) || !Number.isFinite(input.durationSeconds) ||
      input.distanceMeters! <= 0 || input.durationSeconds! <= 0) return manual;
  const resolve = (p: Point) => {
    const matches = card.areas.filter(a => 'center' in a
      ? milesBetween(p, a.center) <= a.radiusMiles
      : p.latitude >= a.south && p.latitude <= a.north && p.longitude >= a.west && p.longitude <= a.east);
    // Circular city zones overlap naturally. Choose the nearest configured city
    // center consistently; ambiguous rectangle configurations still fail closed.
    if (matches.length > 1 && matches.every(a => 'center' in a)) {
      const ranked = matches.map(a => ({ area: a, distance: milesBetween(p, (a as { center: Point }).center) }))
        .sort((a, b) => a.distance - b.distance);
      if (ranked[1].distance - ranked[0].distance < 0.001) return [];
      return [ranked[0].area];
    }
    return matches;
  };
  const origin = resolve(input.pickupLocation!);
  const destination = resolve(input.dropoffLocation!);
  // Overlapping or missing area matches require Operations, not an arbitrary price.
  if (origin.length !== 1 || destination.length !== 1) return manual;
  const rate = card.rates.find(r => r.pickupAreaId === origin[0].id &&
    r.dropoffAreaId === destination[0].id && r.vehicleClass === input.vehicleClass);
  if (!rate) return manual;
  const distanceMinor = Math.round(input.distanceMeters! / 1609.344 * rate.perMileMinor);
  const timeMinor = Math.round(input.durationSeconds! / 60 * rate.perMinuteMinor);
  const subtotal = Math.max(rate.minimumMinor, rate.baseMinor + distanceMinor + timeMinor);
  const windows = card.adjustments.filter(w => at >= Date.parse(w.startsAt) && at < Date.parse(w.endsAt) &&
    (w.areaIds.includes(origin[0].id) || w.areaIds.includes(destination[0].id)));
  // Use the highest applicable uplift, avoiding accidental compound event charges.
  const multiplierBps = Math.max(10_000, ...windows.map(w => w.multiplierBps));
  const amountMinor = Math.ceil(subtotal * multiplierBps / 10_000);
  if (!Number.isSafeInteger(amountMinor) || amountMinor > 100_000_000) return manual;
  return { status: 'quoted' as const, amountMinor, currency: card.currency,
    distanceMeters: input.distanceMeters!, durationSeconds: input.durationSeconds!,
    breakdown: { baseMinor: rate.baseMinor, distanceMinor, timeMinor, hourlyMinor: 0,
      minimumMinor: rate.minimumMinor, adjustmentMinor: amountMinor - subtotal },
    pricing: { version: card.version, pickupAreaId: origin[0].id, dropoffAreaId: destination[0].id,
      multiplierBps, adjustmentIds: windows.filter(w => w.multiplierBps === multiplierBps).map(w => w.id) },
  };
}

export function milesBetween(a: Point, b: Point) {
  const rad = Math.PI / 180;
  const h = Math.sin((b.latitude - a.latitude) * rad / 2) ** 2 +
    Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin((b.longitude - a.longitude) * rad / 2) ** 2;
  return 3958.7613 * 2 * Math.atan2(Math.sqrt(Math.min(1, h)), Math.sqrt(Math.max(0, 1 - h)));
}

// A client waiting charge is distinct from the driver's compensation.
export function calculateClientWaiting(elapsedSeconds: number, graceSeconds: number, perMinuteMinor: number) {
  if (![elapsedSeconds, graceSeconds, perMinuteMinor].every(n => Number.isSafeInteger(n) && n >= 0)) {
    throw new Error('Invalid waiting calculation.');
  }
  const amount = Math.ceil(Math.max(0, elapsedSeconds - graceSeconds) / 60) * perMinuteMinor;
  if (!Number.isSafeInteger(amount)) throw new Error('Waiting amount exceeds supported limits.');
  return amount;
}
