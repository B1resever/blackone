import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { getSessionUser } from '../src/auth.js';
import { sendPushToUser } from '../src/notifications.js';

const schema = z.object({
  requestCode: z.string().trim().min(8).max(64),
  rideCode: z.string().trim().min(4).max(12),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const user = await getSessionUser(req);
  if (!user || user.role !== 'driver') return res.status(401).json({ error: 'driver_unauthorized' });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_request' });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return res.status(503).json({ error: 'backend_not_configured' });
  const sql = neon(databaseUrl);

  const rows = await sql`
    select id, ride_code, passenger_user_id, status, ride_code_verified_at
    from one_reservations
    where request_code = ${parsed.data.requestCode}
      and assigned_driver_user_id = ${user.id}
    limit 1
  `;
  const trip = rows[0];
  if (!trip) return res.status(404).json({ error: 'trip_not_found' });

  if (!['arrived','passenger_onboard'].includes(String(trip.status))) {
    return res.status(409).json({ error: 'ride_code_not_ready' });
  }

  if (trip.ride_code_verified_at) {
    return res.status(200).json({ verified: true, alreadyVerified: true });
  }

  if (String(trip.ride_code ?? '').toUpperCase() !== parsed.data.rideCode.toUpperCase()) {
    return res.status(403).json({ error: 'invalid_ride_code' });
  }

  await sql`
    update one_reservations
    set ride_code_verified_at = now(),
        updated_at = now()
    where id = ${trip.id}
  `;

  await sql`
    insert into one_trip_events (reservation_id, actor_user_id, event_type, payload)
    values (${trip.id}, ${user.id}, 'ride_code_verified', '{}'::jsonb)
  `;

  await sendPushToUser(
    trip.passenger_user_id ? String(trip.passenger_user_id) : null,
    'ONE ride code verified',
    'Your driver verified the ride code. The trip is ready to start.',
    { requestCode: parsed.data.requestCode, url: '/trips' },
  );

  return res.status(200).json({ verified: true });
}
