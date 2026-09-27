import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateQuote } from "@/lib/pricing";
import { getStripe } from "@/lib/stripe";

const schema = z.object({
  rideType: z.enum(["point_to_point", "airport", "hourly", "event"]),
  distanceMiles: z.number().min(0).max(1500),
  durationMinutes: z.number().min(0).max(1440),
  tolls: z.number().min(0).max(500).optional(),
  hourlyHours: z.number().min(1).max(24).optional(),
  pickup: z.string().min(3).max(300),
  destination: z.string().min(3).max(300),
  pickupDate: z.string().min(1),
  pickupTime: z.string().min(1),
  passengers: z.string().min(1).max(20),
  customerEmail: z.string().email(),
  medicalRide: z.boolean().optional().default(false),
  petFriendly: z.boolean().optional().default(false),
  specialNotes: z.string().max(500).optional().default("")
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checkout request", details: parsed.error.flatten() }, { status: 400 });
  }

  const quote = calculateQuote(parsed.data);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return NextResponse.json({ error: "NEXT_PUBLIC_APP_URL is not configured" }, { status: 503 });

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: parsed.data.customerEmail,
      payment_method_types: ["card"],
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(quote.customerTotal * 100),
          product_data: {
            name: "B1 Reserve Private Transportation",
            description: parsed.data.pickup + " -> " + parsed.data.destination
          }
        }
      }],
      metadata: {
        rideType: parsed.data.rideType,
        pickup: parsed.data.pickup.slice(0, 490),
        destination: parsed.data.destination.slice(0, 490),
        pickupDate: parsed.data.pickupDate,
        pickupTime: parsed.data.pickupTime,
        passengers: parsed.data.passengers,
        distanceMiles: String(parsed.data.distanceMiles),
        durationMinutes: String(parsed.data.durationMinutes),
        tolls: String(parsed.data.tolls ?? 0),
        quotedTotal: String(quote.customerTotal),
        medicalRide: String(parsed.data.medicalRide),
        petFriendly: String(parsed.data.petFriendly),
        specialNotes: parsed.data.specialNotes.slice(0, 490)
      },
      success_url: appUrl + "/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: appUrl + "/#book"
    });

    return NextResponse.json({ url: session.url, quote });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Stripe checkout failed" }, { status: 503 });
  }
}
