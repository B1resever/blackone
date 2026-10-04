import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { getSessionUser } from '../src/auth.js';
import { sendPushToUser } from '../src/notifications.js';

const sendSchema = z.object({
  requestCode: z.string().trim().min(8).max(64),
  body: z.string().trim().min(1).max(1000),
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

  const requestCode = req.method === 'GET'
    ? readRequestCode(req)
    : sendSchema.safeParse(req.body).success
      ? sendSchema.parse(req.body).requestCode
      : null;

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

  if (req.method === 'GET') {
    const messages = await sql`
      select
        m.id,
        m.sender_user_id,
        u.role as sender_role,
        u.full_name as sender_name,
        m.body,
        m.created_at
      from one_trip_messages m
      join one_users u on u.id = m.sender_user_id
      where m.reservation_id = ${trip.id}
      order by m.created_at asc
      limit 500
    `;
    return res.status(200).json({ messages });
  }

  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_request' });

  if (['completed','cancelled'].includes(String(trip.status))) {
    return res.status(409).json({ error: 'trip_chat_closed' });
  }

  const inserted = await sql`
    insert into one_trip_messages (reservation_id, sender_user_id, body)
    values (${trip.id}, ${user.id}, ${parsed.data.body})
    returning id, sender_user_id, body, created_at
  `;

  const recipientId =
    String(trip.passenger_user_id ?? '') === user.id
      ? trip.assigned_driver_user_id
      : trip.passenger_user_id;

  await sendPushToUser(
    recipientId ? String(recipientId) : null,
    'New ONE trip message',
    parsed.data.body.length > 100 ? parsed.data.body.slice(0, 97) + '…' : parsed.data.body,
    { requestCode: parsed.data.requestCode, url: '/chat?requestCode=' + encodeURIComponent(parsed.data.requestCode) },
  );

  return res.status(201).json({
    message: {
      ...inserted[0],
      sender_role: user.role,
      sender_name: user.fullName,
    },
  });
}
