import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateQuote } from "@/lib/pricing";

const schema = z.object({
  rideType: z.enum(["point_to_point", "airport"]),
  vehicleClass: z.enum(["comfort","xl","suv"]),
  distanceMiles: z.number().min(0).max(1500),
  durationMinutes: z.number().min(0).max(1440),
  tolls: z.number().min(0).max(500).optional()
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid quote request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  return NextResponse.json({
    status: "estimate",
    currency: "USD",
    quote: calculateQuote(parsed.data)
  });
}
