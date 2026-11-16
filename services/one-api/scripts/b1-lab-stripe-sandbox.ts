/**
 * B1 LAB sandbox integration smoke test. No live payments, no PHI.
 * Run from services/one-api with STRIPE_SECRET_KEY=sk_test_...:
 *   node --import tsx scripts/b1-lab-stripe-sandbox.ts
 * Creates a test card, attaches it to a synthetic institutional customer,
 * confirms a simulated payment and checks Stripe's persisted payment state.
 * Also validates webhook signature handling locally (NOT network delivery).
 */
import Stripe from "stripe";
import assert from "node:assert/strict";

const key = process.env.STRIPE_SECRET_KEY;
if (!key?.startsWith("sk_test_")) throw new Error("SANDBOX_ONLY: STRIPE_SECRET_KEY must begin with sk_test_");
const stripe = new Stripe(key);
const customerIds = ["cus_Vdkivg45zBCyHc", "cus_VdkiIUXOUvvE6e"];
const webhookSecret = process.env.B1_LAB_TEST_WEBHOOK_SECRET ?? "whsec_b1_lab_local_signature_test_only";

async function run() {
  const results: Array<Record<string, unknown>> = [];
  for (const [index, customerId] of customerIds.entries()) {
    const customer = await stripe.customers.retrieve(customerId);
    assert.equal(customer.deleted, undefined);
    assert.equal(customer.livemode, false);
    assert.equal(customer.metadata?.project, "B1_LAB");

    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: { token: "tok_visa" },
      metadata: { project: "B1_LAB", purpose: "sandbox_smoke_test" },
    });
    assert.equal(paymentMethod.livemode, false);
    await stripe.paymentMethods.attach(paymentMethod.id, { customer: customerId });

    const payment = await stripe.paymentIntents.create({
      amount: index === 0 ? 100 : 200,
      currency: "usd",
      customer: customerId,
      payment_method: paymentMethod.id,
      confirm: true,
      off_session: true,
      description: "B1 LAB synthetic service payment - TEST ONLY",
      metadata: { project: "B1_LAB", environment: "sandbox", test_case: String(index + 1) },
    }, { idempotencyKey: `b1lab-sandbox-v1-${customerId}-${index}` });

    assert.equal(payment.livemode, false);
    assert.equal(payment.status, "succeeded");
    const retrieved = await stripe.paymentIntents.retrieve(payment.id);
    assert.equal(retrieved.status, "succeeded");
    assert.equal(retrieved.amount_received, payment.amount);
    assert.equal(retrieved.customer, customerId);

    const eventPayload = JSON.stringify({
      id: `evt_b1_lab_local_${index}`, object: "event", type: "payment_intent.succeeded",
      api_version: "2025-08-27.basil", created: Math.floor(Date.now() / 1000),
      data: { object: retrieved },
      livemode: false,
    });
    const signature = stripe.webhooks.generateTestHeaderString({ payload: eventPayload, secret: webhookSecret });
    const event = stripe.webhooks.constructEvent(eventPayload, signature, webhookSecret);
    assert.equal(event.type, "payment_intent.succeeded");
    assert.equal((event.data.object as Stripe.PaymentIntent).id, payment.id);

    results.push({ customerId, paymentMethodId: paymentMethod.id, paymentIntentId: payment.id,
      amountCents: payment.amount, stripeStatus: retrieved.status,
      webhookSignature: "verified_locally", reconciliation: "amount_received_matched" });
  }
  console.log(JSON.stringify({ mode: "test", results }, null, 2));
}
run().catch(error => { console.error("B1 LAB sandbox smoke test failed:", error); process.exitCode = 1; });
