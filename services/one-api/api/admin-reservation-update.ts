import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { isAdminAuthorized } from '../src/admin-auth.js';
import { sendPushToUser } from '../src/notifications.js';

const schema = z.object({
  requestCode: z.string().trim().min(8).max(64),
  status: z.enum(['requested','quoted','confirmed','assigned','driver_en_route','arrived','passenger_onboard','completed','cancelled']).optional(),
  quoteAmountMinor: z.number().int().positive().optional(),
  quoteCurrency: z.enum(['USD','ARS']).optional(),
  assignedDriverUserId: z.string().uuid().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  if (!isAdminAuthorized(req)) return res.status(401).json({ error: 'unauthorized' });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return res.status(503).json({ error: 'backend_not_configured' });

  const sql = neon(databaseUrl);
  const input = parsed.data;

  if (input.quoteAmountMinor && input.quoteCurrency) {
    await sql`
      update one_reservations
      set quote_amount_minor = ${input.quoteAmountMinor},
          quote_currency = ${input.quoteCurrency},
          quote_confirmed_at = now(),
          status = case when status = 'requested' then 'quoted' else status end,
          updated_at = now()
      where request_code = ${input.requestCode}
    `;
  }

  if (input.assignedDriverUserId) {
    const driverRows = await sql`
      select
        u.id,
        v.id as vehicle_id,
        v.vehicle_class_id
      from one_users u
      join one_driver_profiles p on p.user_id = u.id
      join one_driver_vehicles v on v.driver_user_id = u.id
      join one_reservations r on r.request_code = ${input.requestCode}
      where u.id = ${input.assignedDriverUserId}
        and u.role = 'driver'
        and u.status = 'active'
        and p.verification_status = 'approved'
        and p.compliance_status = 'approved'
        and p.available_for_assignment = true
        and v.status = 'approved'
        and v.vehicle_class_id = r.vehicle_class_id
      order by v.updated_at desc
      limit 1
    `;

    if (!driverRows[0]) {
      return res.status(400).json({ error: 'driver_not_available' });
    }

    await sql`
      update one_reservations
      set assigned_driver_user_id = ${input.assignedDriverUserId},
          assigned_vehicle_id = ${driverRows[0].vehicle_id},
          status = 'assigned',
          updated_at = now()
      where request_code = ${input.requestCode}
    `;

    await sql`
      insert into one_trip_events (reservation_id, actor_user_id, event_type, payload)
      select id, ${input.assignedDriverUserId}, 'driver_assigned', jsonb_build_object('source', 'ONE Ops')
      from one_reservations
      where request_code = ${input.requestCode}
    `;

    const assignmentRows = await sql`
      select passenger_user_id, pickup_text, pickup_date_text, pickup_time_text
      from one_reservations
      where request_code = ${input.requestCode}
      limit 1
    `;
    const assigned = assignmentRows[0];
    await Promise.all([
      sendPushToUser(
        input.assignedDriverUserId,
        'New ONE trip assigned',
        assigned ? String(assigned.pickup_text) + ' · ' + String(assigned.pickup_date_text) + ' ' + String(assigned.pickup_time_text) : 'Open ONE Driver for details.',
        { requestCode: input.requestCode, url: '/driver-access' },
      ),
      sendPushToUser(
        assigned?.passenger_user_id ? String(assigned.passenger_user_id) : null,
        'Your ONE driver is assigned',
        'Open My Reservations to see your driver and vehicle.',
        { requestCode: input.requestCode, url: '/trips' },
      ),
    ]);
  }

  if (input.status) {
    await sql`
      update one_reservations
      set status = ${input.status},
          updated_at = now()
      where request_code = ${input.requestCode}
    `;

    await sql`
      insert into one_trip_events (reservation_id, event_type, payload)
      select id, 'status_changed', jsonb_build_object('status', ${input.status}, 'source', 'ONE Ops')
      from one_reservations
      where request_code = ${input.requestCode}
    `;

    const statusRows = await sql`
      select passenger_user_id
      from one_reservations
      where request_code = ${input.requestCode}
      limit 1
    `;
    const passengerUserId = statusRows[0]?.passenger_user_id ? String(statusRows[0].passenger_user_id) : null;
    const statusMessages: Record<string, string> = {
      confirmed: 'Your reservation is confirmed.',
      driver_en_route: 'Your ONE driver is on the way.',
      arrived: 'Your ONE driver has arrived.',
      passenger_onboard: 'Your ONE trip has started.',
      completed: 'Your ONE trip is complete.',
      cancelled: 'Your ONE reservation was cancelled.',
    };
    if (statusMessages[input.status]) {
      await sendPushToUser(
        passengerUserId,
        'ONE trip update',
        statusMessages[input.status],
        { requestCode: input.requestCode, status: input.status, url: '/trips' },
      );
    }
  }

  const rows = await sql`
    select request_code, status, payment_status, quote_amount_minor, quote_currency, updated_at
    from one_reservations
    where request_code = ${input.requestCode}
    limit 1
  `;

  if (!rows[0]) return res.status(404).json({ error: 'reservation_not_found' });
  return res.status(200).json({ reservation: rows[0] });
}
