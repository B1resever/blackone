import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { isAdminAuthorized } from '../src/admin-auth.js';

const upsertSchema = z.object({
  marketId: z.enum(['south-florida', 'buenos-aires']),
  vehicleClassId: z.enum(['confort', 'xl', 'suv-black', 'ultra-exclusive']),
  rideType: z.enum(['one-way', 'hourly', 'round-trip']),
  currency: z.enum(['USD', 'ARS']),
  baseAmountMinor: z.number().int().min(0),
  minimumAmountMinor: z.number().int().min(0),
  perDistanceMinor: z.number().int().min(0).nullable().optional(),
  distanceUnit: z.enum(['mile', 'km']).nullable().optional(),
  perMinuteMinor: z.number().int().min(0).nullable().optional(),
  hourlyAmountMinor: z.number().int().min(0).nullable().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (!(await isAdminAuthorized(req))) return res.status(401).json({ error: 'unauthorized' });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return res.status(503).json({ error: 'backend_not_configured' });
  const sql = neon(databaseUrl);

  if (req.method === 'GET') {
    const rows = await sql`
      select
        id,
        market_id,
        vehicle_class_id,
        ride_type,
        currency,
        base_amount_minor,
        minimum_amount_minor,
        per_distance_minor,
        distance_unit,
        per_minute_minor,
        hourly_amount_minor,
        active,
        effective_from,
        effective_to
      from one_market_rates
      order by market_id, vehicle_class_id, ride_type, effective_from desc
    `;
    return res.status(200).json({ rates: rows });
  }

  if (req.method !== 'POST') return methodNotAllowed(res, ['GET', 'POST']);

  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });
  }

  const input = parsed.data;

  await sql`
    update one_market_rates
    set active = false,
        effective_to = now()
    where market_id = ${input.marketId}
      and vehicle_class_id = ${input.vehicleClassId}
      and ride_type = ${input.rideType}
      and active = true
  `;

  await sql`
    insert into one_market_rates (
      market_id,
      vehicle_class_id,
      ride_type,
      currency,
      base_amount_minor,
      minimum_amount_minor,
      per_distance_minor,
      distance_unit,
      per_minute_minor,
      hourly_amount_minor,
      active
    ) values (
      ${input.marketId},
      ${input.vehicleClassId},
      ${input.rideType},
      ${input.currency},
      ${input.baseAmountMinor},
      ${input.minimumAmountMinor},
      ${input.perDistanceMinor ?? null},
      ${input.distanceUnit ?? null},
      ${input.perMinuteMinor ?? null},
      ${input.hourlyAmountMinor ?? null},
      true
    )
  `;

  return res.status(200).json({ updated: true });
}
