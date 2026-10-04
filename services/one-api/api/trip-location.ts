import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { getSessionUser } from '../src/auth.js';

const locationSchema = z.object({
  requestCode: z.string().trim().min(8).max(64),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMeters: z.number().nonnegative().max(10000).nullable().optional(),
  headingDegrees: z.number().min(0).max(360).nullable().optional(),
  speedMps: z.number().min(-1).max(200).nullable().optional(),
});

function readRequestCode(req: VercelRequest) {
  const value = req.query.requestCode;
  return Array.isArray(value) ? value[0] : value;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (!['GET','POST'].includes(req.method ?? '')) return methodNotAllowed(res, ['GET','POST']);

  const user = await getSessionUser(req);
  if (!user || !['passenger','driver'].includes(user.role)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return res.status(503).json({ error: 'backend_not_configured' });
  const sql = neon(databaseUrl);

  if (req.method === 'GET') {
    const requestCode = readRequestCode(req);
    if (!requestCode) return res.status(400).json({ error: 'invalid_request' });

    const trips = await sql`
      select id, passenger_user_id, assigned_driver_user_id, status
      from one_reservations
      where request_code = ${requestCode}
        and (
          passenger_user_id = ${user.id}
          or assigned_driver_user_id = ${user.id}
        )
      limit 1
    `;
    const trip = trips[0];
    if (!trip) return res.status(404).json({ error: 'trip_not_found' });

    const locations = await sql`
      select latitude, longitude, accuracy_meters, heading_degrees, speed_mps, created_at
      from one_driver_locations
      where reservation_id = ${trip.id}
      order by created_at desc
      limit 1
    `;

    return res.status(200).json({
      status: trip.status,
      location: locations[0] ?? null,
    });
  }

  if (user.role !== 'driver') return res.status(403).json({ error: 'driver_required' });

  const parsed = locationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });

  const input = parsed.data;
  const trips = await sql`
    select id, status
    from one_reservations
    where request_code = ${input.requestCode}
      and assigned_driver_user_id = ${user.id}
      and status in ('assigned','driver_en_route','arrived','passenger_onboard')
    limit 1
  `;
  const trip = trips[0];
  if (!trip) return res.status(404).json({ error: 'active_trip_not_found' });

  const rows = await sql`
    insert into one_driver_locations (
      reservation_id,
      driver_user_id,
      latitude,
      longitude,
      accuracy_meters,
      heading_degrees,
      speed_mps
    ) values (
      ${trip.id},
      ${user.id},
      ${input.latitude},
      ${input.longitude},
      ${input.accuracyMeters ?? null},
      ${input.headingDegrees ?? null},
      ${input.speedMps ?? null}
    )
    returning latitude, longitude, accuracy_meters, heading_degrees, speed_mps, created_at
  `;

  return res.status(201).json({ location: rows[0] });
}
