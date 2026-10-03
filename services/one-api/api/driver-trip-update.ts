import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { getSessionUser } from '../src/auth.js';
import { sendPushToUser } from '../src/notifications.js';

const schema = z.object({
  requestCode: z.string().trim().min(8).max(64),
  status: z.enum(['driver_en_route','arrived','passenger_onboard','completed']),
});

const allowedTransitions: Record<string, string[]> = {
  assigned: ['driver_en_route'],
  confirmed: ['driver_en_route'],
  driver_en_route: ['arrived'],
  arrived: ['passenger_onboard'],
  passenger_onboard: ['completed'],
};

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
    select id, status, passenger_user_id
    from one_reservations
    where request_code = ${parsed.data.requestCode}
      and assigned_driver_user_id = ${user.id}
    limit 1
  `;

  const trip = rows[0];
  if (!trip) return res.status(404).json({ error: 'trip_not_found' });

  const allowed = allowedTransitions[String(trip.status)] ?? [];
  if (!allowed.includes(parsed.data.status)) {
    return res.status(409).json({
      error: 'invalid_status_transition',
      currentStatus: trip.status,
      allowed,
    });
  }

  await sql`
    update one_reservations
    set status = ${parsed.data.status},
        updated_at = now()
    where id = ${trip.id}
  `;

  await sql`
    insert into one_trip_events (reservation_id, actor_user_id, event_type, payload)
    values (
      ${trip.id},
      ${user.id},
      'driver_status_changed',
      jsonb_build_object('status', ${parsed.data.status})
    )
  `;

  const passengerMessages: Record<string, string> = {
    driver_en_route: 'Your ONE driver is on the way.',
    arrived: 'Your ONE driver has arrived.',
    passenger_onboard: 'Your ONE trip has started.',
    completed: 'Your ONE trip is complete.',
  };

  await sendPushToUser(
    trip.passenger_user_id ? String(trip.passenger_user_id) : null,
    'ONE trip update',
    passengerMessages[parsed.data.status],
    { requestCode: parsed.data.requestCode, status: parsed.data.status, url: '/trips' },
  );

  return res.status(200).json({
    requestCode: parsed.data.requestCode,
    status: parsed.data.status,
  });
}
