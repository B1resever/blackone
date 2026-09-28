import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateQuote } from "@/lib/pricing";
import { getStripe } from "@/lib/stripe";

const schema = z.object({
  rideType: z.enum(["point_to_point", "airport"]),
  vehicleClass: z.enum(["comfort","xl","suv"]),
  distanceMiles: z.number().min(0).max(1500),
  durationMinutes: z.number().min(0).max(1440),
  tolls: z.number().min(0).max(500).optional(),
  pickup: z.string().min(3).max(300),
  destination: z.string().min(3).max(300),
  pickupDate: z.string().min(1),
  pickupTime: z.string().min(1),
  passengers: z.string().min(1).max(20),
  customerEmail: z.string().email()
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
            name: `B1 ${parsed.data.vehicleClass.toUpperCase()} Transportation`,
            description: parsed.data.pickup + " -> " + parsed.data.destination
          }
        }
      }],
      metadata: {
        rideType: parsed.data.rideType,
        vehicleClass: parsed.data.vehicleClass,
        pickup: parsed.data.pickup.slice(0, 490),
        destination: parsed.data.destination.slice(0, 490),
        pickupDate: parsed.data.pickupDate,
        pickupTime: parsed.data.pickupTime,
        passengers: parsed.data.passengers,
        distanceMiles: String(parsed.data.distanceMiles),
        durationMinutes: String(parsed.data.durationMinutes),
        tolls: String(parsed.data.tolls ?? 0),
        quotedTotal: String(quote.customerTotal)
      },
      success_url: appUrl + "/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: appUrl + "/#book"
    });

    return NextResponse.json({ url: session.url, quote });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Stripe checkout failed" }, { status: 503 });
  }
}
