import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

export async function GET() {
  try {
    const pool = getDbPool();
    const result = await pool.query(`select public_code, ride_type, pickup_address, destination_address, pickup_at, passenger_count, quoted_total, payment_status, trip_status, created_at from reservations order by pickup_at asc limit 100`);
    return NextResponse.json({ reservations: result.rows });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Database unavailable" }, { status: 503 });
  }
}
