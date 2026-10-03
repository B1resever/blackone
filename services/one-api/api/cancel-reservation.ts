import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { allowCors, methodNotAllowed } from '../src/http.js';

const schema = z.object({
  requestCode: z.string().trim().min(8).max(64),
  email: z.string().email().max(254),
  reason: z.string().trim().max(1000).default(''),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_request' });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return res.status(503).json({ error: 'backend_not_configured' });

  const sql = neon(databaseUrl);
  const rows = await sql`
    select id, request_code, status, payment_status
    from one_reservations
    where request_code = ${parsed.data.requestCode}
      and lower(guest_email) = lower(${parsed.data.email})
    limit 1
  `;

  const reservation = rows[0];
  if (!reservation) return res.status(404).json({ error: 'reservation_not_found' });

  if (['completed','cancelled'].includes(String(reservation.status))) {
    return res.status(409).json({ error: 'reservation_not_cancellable' });
  }

  await sql`
    update one_reservations
    set status = 'cancelled',
        updated_at = now()
    where id = ${reservation.id}
  `;

  await sql`
    insert into one_trip_events (reservation_id, event_type, payload)
    values (
      ${reservation.id},
      'cancelled_by_passenger',
      jsonb_build_object('reason', ${parsed.data.reason || null})
    )
  `;

  return res.status(200).json({
    requestCode: reservation.request_code,
    status: 'cancelled',
    paymentStatus: reservation.payment_status,
    message: reservation.payment_status === 'paid'
      ? 'Cancellation recorded. Refund handling follows the applicable cancellation policy.'
      : 'Cancellation recorded.',
  });
}
