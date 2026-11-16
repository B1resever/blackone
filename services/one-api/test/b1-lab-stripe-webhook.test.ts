import { test } from "node:test";
import assert from "node:assert/strict";
import Stripe from "stripe";
import { handleB1LabStripeWebhook, type B1LabPaymentRecord } from "../src/b1-lab/stripe-webhook.js";

const stripe = new Stripe("sk_test_local_only");
const secret = "whsec_local_only";
function makeEvent(overrides: Record<string, unknown> = {}) {
  const pi = { id: "pi_synthetic", object: "payment_intent", status: "succeeded", amount: 100, amount_received: 100,
    currency: "usd", customer: "cus_synthetic", metadata: { project: "B1_LAB", environment: "sandbox" }, ...overrides };
  const rawBody = JSON.stringify({ id: "evt_synthetic", object: "event", type: "payment_intent.succeeded",
    livemode: false, data: { object: pi } });
  const signature = stripe.webhooks.generateTestHeaderString({ payload: rawBody, secret });
  return { rawBody, signature };
}
test("accepts a valid signed and reconciled sandbox event", async () => {
  const recorded: B1LabPaymentRecord[] = [];
  const result = await handleB1LabStripeWebhook({ ...makeEvent(), signingSecret: secret, stripe,
    store: { async recordPaymentOnce(record) { recorded.push(record); return true; } } });
  assert.equal(result.status, 200);
  assert.equal(recorded[0].amountCents, 100);
});
test("rejects invalid signature", async () => {
  const result = await handleB1LabStripeWebhook({ ...makeEvent(), signature: "invalid", signingSecret: secret, stripe,
    store: { async recordPaymentOnce() { throw Error("must not run"); } } });
  assert.equal(result.status, 400);
});
test("rejects reconciliation mismatch", async () => {
  const result = await handleB1LabStripeWebhook({ ...makeEvent({ amount_received: 0 }), signingSecret: secret, stripe,
    store: { async recordPaymentOnce() { throw Error("must not run"); } } });
  assert.equal(result.status, 422);
});
test("recognizes duplicate event", async () => {
  const result = await handleB1LabStripeWebhook({ ...makeEvent(), signingSecret: secret, stripe,
    store: { async recordPaymentOnce() { return false; } } });
  assert.deepEqual(result.body, { received: true, duplicate: true });
});
