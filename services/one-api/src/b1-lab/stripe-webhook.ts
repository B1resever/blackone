import Stripe from "stripe";

export type B1LabPaymentRecord = {
  paymentIntentId: string;
  customerId: string;
  amountCents: number;
  currency: string;
  status: "paid";
  stripeEventId: string;
};
export interface B1LabPaymentStore {
  // Must atomically insert by unique stripeEventId AND paymentIntentId.
  // Returns false when event was already processed.
  recordPaymentOnce(record: B1LabPaymentRecord): Promise<boolean>;
}

/**
 * Verify the raw Stripe payload BEFORE parsing. No PHI is stored.
 * Production caller must provide durable DB store, secret from env,
 * and raw request body (not JSON.stringify(parsedBody)).
 */
export async function handleB1LabStripeWebhook(args: {
  rawBody: string | Buffer;
  signature: string | undefined;
  signingSecret: string;
  stripe: Stripe;
  store: B1LabPaymentStore;
}): Promise<{ status: number; body: { received?: boolean; duplicate?: boolean; error?: string } }> {
  if (!args.signature || !args.signingSecret) {
    return { status: 400, body: { error: "Missing webhook authentication" } };
  }
  let event: Stripe.Event;
  try {
    event = args.stripe.webhooks.constructEvent(args.rawBody, args.signature, args.signingSecret);
  } catch {
    return { status: 400, body: { error: "Invalid Stripe signature" } };
  }
  if (event.livemode) return { status: 400, body: { error: "Sandbox webhook only" } };
  if (event.type !== "payment_intent.succeeded") return { status: 200, body: { received: true } };
  const pi = event.data.object as Stripe.PaymentIntent;
  if (pi.metadata?.project !== "B1_LAB" || pi.metadata?.environment !== "sandbox") {
    return { status: 200, body: { received: true } };
  }
  if (pi.status !== "succeeded" || pi.amount_received !== pi.amount || pi.amount <= 0 ||
      pi.currency !== "usd" || typeof pi.customer !== "string") {
    return { status: 422, body: { error: "Payment reconciliation mismatch" } };
  }
  try {
    const inserted = await args.store.recordPaymentOnce({
      paymentIntentId: pi.id, customerId: pi.customer, amountCents: pi.amount_received,
      currency: pi.currency, status: "paid", stripeEventId: event.id,
    });
    return { status: 200, body: { received: true, duplicate: !inserted } };
  } catch {
    return { status: 500, body: { error: "Persistence failed; Stripe may retry" } };
  }
}
