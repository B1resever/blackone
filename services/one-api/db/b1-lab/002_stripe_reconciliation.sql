-- B1 LAB payment reconciliation schema (DRAFT: do not apply without tenant/RLS review)
-- No patient information. Database access restricted to backend service account.
CREATE TABLE IF NOT EXISTS b1_lab.stripe_webhook_events (
  stripe_event_id text PRIMARY KEY,
  stripe_payment_intent_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL CHECK (currency = 'usd'),
  payment_status text NOT NULL CHECK (payment_status = 'paid'),
  received_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS b1_lab_stripe_webhook_customer_idx
  ON b1_lab.stripe_webhook_events(stripe_customer_id, received_at DESC);
-- Webhook DB writer must use INSERT ... ON CONFLICT DO NOTHING in a transaction.
-- Do not expose this table to mobile clients. No PHI or card details.
