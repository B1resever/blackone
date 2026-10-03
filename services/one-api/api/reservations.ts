import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { createRequestCode } from '../src/ids.js';
import { reservationRequestSchema } from '../src/validation.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const parsed = reservationRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'invalid_request',
      details: parsed.error.flatten(),
    });
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return res.status(503).json({
      error: 'backend_not_configured',
      message: 'Reservation database is not connected yet.',
    });
  }

  const sql = neon(connectionString);
  const data = parsed.data;
  const requestCode = createRequestCode();

  try {
    const rows = await sql`
      insert into one_reservations (
        request_code,
        market_id,
        ride_type,
        pickup_text,
        dropoff_text,
        pickup_date_text,
        pickup_time_text,
        passenger_count,
        vehicle_class_id,
        guest_full_name,
        guest_email,
        guest_phone,
        notes,
        status,
        payment_status
      ) values (
        ${requestCode},
        ${data.marketId},
        ${data.rideType},
        ${data.pickup},
        ${data.rideType === 'hourly' ? null : data.dropoff},
        ${data.pickupDate},
        ${data.pickupTime},
        ${data.passengers},
        ${data.vehicleClass},
        ${data.fullName},
        ${data.email.toLowerCase()},
        ${data.phone},
        ${data.notes || null},
        'requested',
        'not_started'
      )
      returning id, request_code, status, created_at
    `;

    return res.status(201).json({
      reservation: rows[0],
      message: 'Reservation request received. Final availability and price require confirmation.',
    });
  } catch (error) {
    console.error('ONE reservation insert failed', error);
    return res.status(500).json({ error: 'reservation_failed' });
  }
}
