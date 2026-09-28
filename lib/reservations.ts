import { randomUUID } from "crypto";
import { getDbPool } from "@/lib/db";

function publicCode() {
  return "B1-" + randomUUID().slice(0, 8).toUpperCase();
}

export async function persistPaidReservation(input: {
  email: string;
  rideType: string;
  pickup: string;
  destination: string;
  pickupDate: string;
  pickupTime: string;
  passengers: number;
  distanceMiles: number;
  durationMinutes: number;
  tolls: number;
  quotedTotal: number;
  stripeCheckoutSessionId: string;
}) {
  const pool = getDbPool();
  const client = await pool.connect();

  try {
    await client.query("begin");

    const customer = await client.query(
      "insert into customers (email) values ($1) on conflict (email) do update set email = excluded.email returning id",
      [input.email]
    );

    const pickupAt = new Date(input.pickupDate + "T" + input.pickupTime + ":00");

    const reservation = await client.query(
      "insert into reservations (public_code, customer_id, ride_type, pickup_address, destination_address, pickup_at, passenger_count, distance_miles, duration_minutes, estimated_tolls, quoted_total, payment_status, trip_status, stripe_checkout_session_id) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'paid','confirmed',$12) on conflict (stripe_checkout_session_id) do update set payment_status='paid', trip_status='confirmed', updated_at=now() returning id, public_code",
      [publicCode(), customer.rows[0].id, input.rideType, input.pickup, input.destination, pickupAt, input.passengers, input.distanceMiles, input.durationMinutes, input.tolls, input.quotedTotal, input.stripeCheckoutSessionId]
    );

    await client.query(
      "insert into reservation_events (reservation_id, event_type, details) values ($1, $2, $3::jsonb)",
      [reservation.rows[0].id, "payment_confirmed", JSON.stringify({ stripeCheckoutSessionId: input.stripeCheckoutSessionId })]
    );

    await client.query("commit");
    return reservation.rows[0] as { id: string; public_code: string };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
