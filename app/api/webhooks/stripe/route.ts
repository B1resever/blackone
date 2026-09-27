import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { persistPaidReservation } from "@/lib/reservations";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json({ error: "Stripe webhook is not configured" }, { status: 503 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const m = session.metadata ?? {};

    if (session.payment_status === "paid" && session.customer_details?.email) {
      await persistPaidReservation({
        email: session.customer_details.email,
        rideType: m.rideType ?? "point_to_point",
        pickup: m.pickup ?? "",
        destination: m.destination ?? "",
        pickupDate: m.pickupDate ?? "",
        pickupTime: m.pickupTime ?? "",
        passengers: Number(m.passengers ?? "1"),
        distanceMiles: Number(m.distanceMiles ?? "0"),
        durationMinutes: Number(m.durationMinutes ?? "0"),
        tolls: Number(m.tolls ?? "0"),
        quotedTotal: Number(m.quotedTotal ?? "0"),
        stripeCheckoutSessionId: session.id
      });
    }
  }

  return NextResponse.json({ received: true });
}
