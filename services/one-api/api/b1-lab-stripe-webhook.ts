import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { neon } from "@neondatabase/serverless";
import { handleB1LabStripeWebhook } from "../src/b1-lab/stripe-webhook.js";

// Isolated B1 LAB test endpoint; does not alter ONE transportation webhook.
export const config = { api: { bodyParser: false } };
async function rawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  const key = process.env.B1_LAB_STRIPE_TEST_SECRET_KEY;
  const secret = process.env.B1_LAB_STRIPE_TEST_WEBHOOK_SECRET;
  const databaseUrl = process.env.B1_LAB_DATABASE_URL;
  if (!key?.startsWith("sk_test_") || !secret?.startsWith("whsec_") || !databaseUrl)
    return res.status(503).json({ error: "b1_lab_test_webhook_not_configured" });
  const stripe = new Stripe(key);
  const sql = neon(databaseUrl);
  const result = await handleB1LabStripeWebhook({
    rawBody: await rawBody(req),
    signature: typeof req.headers["stripe-signature"] === "string" ? req.headers["stripe-signature"] : undefined,
    signingSecret: secret,
    stripe,
    store: {
      async recordPaymentOnce(payment) {
        const rows = await sql`
          insert into b1_lab.stripe_webhook_events (
            stripe_event_id, stripe_payment_intent_id, stripe_customer_id,
            amount_cents, currency, payment_status
          ) values (
            ${payment.stripeEventId}, ${payment.paymentIntentId}, ${payment.customerId},
            ${payment.amountCents}, ${payment.currency}, ${payment.status}
          ) on conflict do nothing
          returning stripe_event_id
        `;
        return rows.length === 1;
      },
    },
  });
  return res.status(result.status).json(result.body);
}
