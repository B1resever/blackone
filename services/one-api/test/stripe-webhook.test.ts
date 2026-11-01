import assert from 'node:assert/strict';
import { test } from 'node:test';
import Stripe from 'stripe';
import { Readable } from 'node:stream';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import handler, { config, processStripeEvent } from '../api/stripe-webhook.js';

function checkoutEvent(type: Stripe.Event.Type, paymentStatus: string, metadata: Record<string, string> = { one_request_code: 'ONE-TEST-ONLY' }) {
  return {
    type,
    data: { object: {
      id: 'cs_test_fixture', payment_status: paymentStatus,
      amount_total: 12000, currency: 'usd', payment_intent: 'pi_test_fixture', metadata,
    } },
  } as unknown as Stripe.Event;
}

function databaseRecorder() {
  const queries: { text: string; values: unknown[] }[] = [];
  const sql = async (parts: TemplateStringsArray, ...values: unknown[]) => {
    queries.push({ text: parts.join('?'), values });
    return [];
  };
  return { queries, sql: sql as unknown as NeonQueryFunction<false, false> };
}

test('completed unpaid Checkout never confirms a reservation or records a payment', async () => {
  for (const paymentStatus of ['unpaid', 'no_payment_required']) {
    const db = databaseRecorder();
    await processStripeEvent(checkoutEvent('checkout.session.completed', paymentStatus), db.sql);
    assert.equal(db.queries.length, 0);
  }
});

test('completed unpaid Checkout never credits a driver monthly fee', async () => {
  const db = databaseRecorder();
  const event = checkoutEvent('checkout.session.completed', 'unpaid');
  (event.data.object as Stripe.Checkout.Session).metadata = {
    one_payment_type: 'driver_monthly_fee', one_driver_user_id: 'driver-fixture', one_month_key: '2026-10',
  };
  await processStripeEvent(event, db.sql);
  assert.equal(db.queries.length, 0);
});

test('settled card and delayed payments record the Stripe payment against the reservation', async () => {
  for (const type of ['checkout.session.completed', 'checkout.session.async_payment_succeeded'] as const) {
    const db = databaseRecorder();
    await processStripeEvent(checkoutEvent(type, 'paid'), db.sql);
    assert.equal(db.queries.length, 1);
    assert.match(db.queries[0].text, /payment_status = 'paid'/);
    assert.match(db.queries[0].text, /insert into one_payments/);
    assert.ok(db.queries[0].values.includes('pi_test_fixture'));
    assert.ok(db.queries[0].values.includes('ONE-TEST-ONLY'));
  }
});

test('unrelated account Checkout does not write ONE reservations', async () => {
  const db = databaseRecorder();
  await processStripeEvent(checkoutEvent('checkout.session.completed', 'paid', {}), db.sql);
  assert.equal(db.queries.length, 0);
});


test('webhook verifies the exact raw bytes and rejects missing or tampered signatures', async () => {
  const oldEnv = { ...process.env };
  process.env.STRIPE_SECRET_KEY = 'sk_test_local_fixture';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_local_fixture';
  process.env.DATABASE_URL = 'postgresql://fixture:fixture@example.invalid/fixture';
  const payload = JSON.stringify({ id: 'evt_local_fixture', type: 'unhandled.fixture', data: { object: {} } });
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET });
  async function deliver(raw: string, header?: string) {
    const request = Readable.from([Buffer.from(raw.slice(0, 11)), Buffer.from(raw.slice(11))]);
    Object.assign(request, { method: 'POST', headers: header ? { 'stripe-signature': header } : {} });
    let status = 0;
    let body: unknown;
    const response = { status(value: number) { status = value; return this; }, json(value: unknown) { body = value; return this; } };
    await handler(request as VercelRequest, response as unknown as VercelResponse);
    return { status, body };
  }
  try {
    assert.equal(config.api.bodyParser, false);
    assert.deepEqual(await deliver(payload, signature), { status: 200, body: { received: true } });
    assert.deepEqual(await deliver(payload + ' ', signature), { status: 400, body: { error: 'invalid_signature' } });
    assert.deepEqual(await deliver(payload), { status: 400, body: { error: 'invalid_signature' } });
    delete process.env.STRIPE_SECRET_KEY;
    assert.equal((await deliver(payload, signature)).status, 503);
  } finally {
    process.env = oldEnv;
  }
});
