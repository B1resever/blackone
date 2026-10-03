import { neon } from '@neondatabase/serverless';
import type { RouteMetrics } from './maps.js';

type FareInput = {
  marketId: string;
  vehicleClass: string;
  rideType: 'one-way' | 'hourly' | 'round-trip';
  hourlyHours: number;
  route?: RouteMetrics;
};

type RateRow = {
  currency: string;
  base_amount_minor: string | number;
  minimum_amount_minor: string | number;
  per_distance_minor: string | number | null;
  distance_unit: 'mile' | 'km' | null;
  per_minute_minor: string | number | null;
  hourly_amount_minor: string | number | null;
};

export type QuoteResult =
  | {
      status: 'quoted';
      amountMinor: number;
      currency: string;
      distanceMeters: number | null;
      durationSeconds: number | null;
      breakdown: {
        baseMinor: number;
        distanceMinor: number;
        timeMinor: number;
        hourlyMinor: number;
        minimumMinor: number;
      };
    }
  | {
      status: 'manual_confirmation' | 'rate_card_required';
      amountMinor: null;
      currency: string;
      distanceMeters: number | null;
      durationSeconds: number | null;
    };

function numeric(value: string | number | null | undefined) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function distanceUnits(distanceMeters: number, unit: 'mile' | 'km' | null) {
  if (unit === 'km') return distanceMeters / 1000;
  return distanceMeters / 1609.344;
}

export async function calculateQuote(input: FareInput): Promise<QuoteResult> {
  const databaseUrl = process.env.DATABASE_URL;
  const fallbackCurrency = input.marketId === 'buenos-aires' ? 'ARS' : 'USD';

  if (!databaseUrl) {
    return {
      status: 'manual_confirmation',
      amountMinor: null,
      currency: fallbackCurrency,
      distanceMeters: input.route?.distanceMeters ?? null,
      durationSeconds: input.route?.durationSeconds ?? null,
    };
  }

  const sql = neon(databaseUrl);
  const rows = await sql`
    select
      currency,
      base_amount_minor,
      minimum_amount_minor,
      per_distance_minor,
      distance_unit,
      per_minute_minor,
      hourly_amount_minor
    from one_market_rates
    where market_id = ${input.marketId}
      and vehicle_class_id = ${input.vehicleClass}
      and ride_type = ${input.rideType}
      and active = true
      and effective_from <= now()
      and (effective_to is null or effective_to > now())
    order by effective_from desc
    limit 1
  `;

  const rate = rows[0] as RateRow | undefined;
  if (!rate) {
    return {
      status: 'rate_card_required',
      amountMinor: null,
      currency: fallbackCurrency,
      distanceMeters: input.route?.distanceMeters ?? null,
      durationSeconds: input.route?.durationSeconds ?? null,
    };
  }

  const baseMinor = numeric(rate.base_amount_minor);
  const minimumMinor = numeric(rate.minimum_amount_minor);
  let distanceMinor = 0;
  let timeMinor = 0;
  let hourlyMinor = 0;

  if (input.rideType === 'hourly') {
    const hourlyRate = numeric(rate.hourly_amount_minor);
    hourlyMinor = hourlyRate * input.hourlyHours;
  } else if (input.route) {
    const distanceRate = numeric(rate.per_distance_minor);
    const minuteRate = numeric(rate.per_minute_minor);
    distanceMinor = Math.round(distanceUnits(input.route.distanceMeters, rate.distance_unit) * distanceRate);
    timeMinor = Math.round((input.route.durationSeconds / 60) * minuteRate);

    if (input.rideType === 'round-trip') {
      distanceMinor *= 2;
      timeMinor *= 2;
    }
  }

  const computed = baseMinor + distanceMinor + timeMinor + hourlyMinor;
  const amountMinor = Math.max(minimumMinor, computed);

  return {
    status: 'quoted',
    amountMinor,
    currency: rate.currency,
    distanceMeters: input.route?.distanceMeters ?? null,
    durationSeconds: input.route?.durationSeconds ?? null,
    breakdown: {
      baseMinor,
      distanceMinor,
      timeMinor,
      hourlyMinor,
      minimumMinor,
    },
  };
}
