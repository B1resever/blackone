import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { allowCors, methodNotAllowed } from '../src/http.js';
import { createRequestCode } from '../src/ids.js';
import { computeRoute } from '../src/maps.js';
import { calculateQuote } from '../src/pricing.js';
import { reservationRequestSchema } from '../src/validation.js';
import { getSessionUser } from '../src/auth.js';

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
  const accountUser = await getSessionUser(req);

  let route;
  if (data.rideType !== 'hourly' && process.env.GOOGLE_MAPS_SERVER_KEY) {
    try {
      route = await computeRoute(data.pickup, data.dropoff);
    } catch (error) {
      console.error('ONE reservation route calculation failed', error);
    }
  }

  let quote;
  try {
    quote = await calculateQuote({
      marketId: data.marketId,
      vehicleClass: data.vehicleClass,
      rideType: data.rideType,
      hourlyHours: data.hourlyHours,
      route,
    });
  } catch (error) {
    console.error('ONE reservation quote calculation failed', error);
    quote = {
      status: 'manual_confirmation' as const,
      amountMinor: null,
      currency: data.marketId === 'buenos-aires' ? 'ARS' : 'USD',
      distanceMeters: route?.distanceMeters ?? null,
      durationSeconds: route?.durationSeconds ?? null,
    };
  }

  try {
    const rows = await sql`
      insert into one_reservations (
        request_code,
        passenger_user_id,
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
        payment_status,
        quote_amount_minor,
        quote_currency,
        quote_confirmed_at
      ) values (
        ${requestCode},
        ${accountUser?.role === 'passenger' ? accountUser.id : null},
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
        ${JSON.stringify({
          customerNotes: data.notes || null,
          returnDate: data.rideType === 'round-trip' ? data.returnDate : null,
          returnTime: data.rideType === 'round-trip' ? data.returnTime : null,
          hourlyHours: data.rideType === 'hourly' ? data.hourlyHours : null,
          routeDistanceMeters: route?.distanceMeters ?? null,
          routeDurationSeconds: route?.durationSeconds ?? null
        })},
        ${quote.status === 'quoted' ? 'quoted' : 'requested'},
        'not_started',
        ${quote.status === 'quoted' ? quote.amountMinor : null},
        ${quote.currency},
        ${quote.status === 'quoted' ? new Date().toISOString() : null}
      )
      returning
        id,
        request_code,
        status,
        quote_amount_minor,
        quote_currency,
        created_at
    `;

    return res.status(201).json({
      reservation: rows[0],
      quote: {
        status: quote.status,
        amountMinor: quote.status === 'quoted' ? quote.amountMinor : null,
        currency: quote.currency,
        distanceMeters: quote.distanceMeters,
        durationSeconds: quote.durationSeconds,
      },
      message:
        quote.status === 'quoted'
          ? 'Reservation request received with a calculated ONE fare.'
          : 'Reservation request received. Final availability and price require confirmation.',
    });
  } catch (error) {
    console.error('ONE reservation insert failed', error);
    return res.status(500).json({ error: 'reservation_failed' });
  }
}
