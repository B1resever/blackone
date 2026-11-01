// Fictitious payment events only; never calls Stripe or a production database.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import type Stripe from 'stripe';
import { processStripeEvent } from '../api/stripe-webhook.js';

assert.equal(process.env.ONE_TEST_BRANCH_ID, 'br-crimson-hill-avv1kiko');
assert.ok(process.env.ONE_TEST_DATABASE_URL);
assert.equal(new URL(process.env.ONE_TEST_DATABASE_URL!).hostname,
  'ep-orange-cell-av3w3jlz-pooler.c-11.us-east-1.aws.neon.tech',
  'Production and unrelated database hosts are forbidden');
const sql = neon(process.env.ONE_TEST_DATABASE_URL!);
const suffix = randomBytes(8).toString('hex');
let sequence = 0;

async function fixture() {
  const code = `ONE-PAYMENT-FIXTURE-${suffix}-${++sequence}`;
  const intent = `pi_test_fixture_${suffix}_${sequence}`;
  await sql`
    insert into one_reservations (
      request_code, market_id, ride_type, pickup_text, dropoff_text,
      pickup_date_text, pickup_time_text, passenger_count, vehicle_class_id,
      guest_full_name, guest_phone, status, payment_status, quote_amount_minor, quote_currency
    ) values (
      ${code}, 'south-florida', 'one-way', 'FIXTURE PICKUP', 'FIXTURE DROPOFF',
      '2099-12-01', '14:00', 2, 'suv-black', 'FICTIONAL PASSENGER',
      'FIXTURE PHONE', 'quoted', 'checkout_created', 12000, 'USD'
    )
  `;
  const paid = { type: 'checkout.session.completed', data: { object: {
    id: `cs_test_fixture_${suffix}_${sequence}`, payment_status: 'paid',
    payment_intent: intent, amount_total: 12000, currency: 'usd', metadata: { one_request_code: code },
  } } } as unknown as Stripe.Event;
  const failed = { type: 'payment_intent.payment_failed', data: { object: {
    id: intent, metadata: { one_request_code: code },
  } } } as unknown as Stripe.Event;
  function refund(amount: number) {
    return { type: 'charge.refunded', data: { object: {
      payment_intent: intent, amount_refunded: amount,
    } } } as unknown as Stripe.Event;
  }
  async function state() {
    const rows = await sql`
      select r.status, r.payment_status, p.status as ledger_status,
        (select count(*)::integer from one_payments where provider_payment_id = ${intent}) as payment_count
      from one_reservations r
      left join one_payments p on p.reservation_id = r.id and p.provider_payment_id = ${intent}
      where r.request_code = ${code}
    `;
    return rows[0];
  }
  return { paid, failed, refund, state, code };
}

const replay = await fixture();
await Promise.all([processStripeEvent(replay.paid, sql), processStripeEvent(replay.paid, sql)]);
assert.deepEqual(await replay.state(), {
  status: 'confirmed', payment_status: 'paid', ledger_status: 'paid', payment_count: 1,
});
await processStripeEvent(replay.failed, sql);
assert.equal((await replay.state()).payment_status, 'paid', 'Late failure cannot undo settlement');
await processStripeEvent(replay.refund(2000), sql);
assert.equal((await replay.state()).payment_status, 'paid', 'A partial refund is not a full refund');
await processStripeEvent(replay.refund(12000), sql);
await processStripeEvent(replay.paid, sql);
await processStripeEvent(replay.failed, sql);
assert.deepEqual(await replay.state(), {
  status: 'confirmed', payment_status: 'refunded', ledger_status: 'refunded', payment_count: 1,
});

const retry = await fixture();
await processStripeEvent(retry.failed, sql);
assert.equal((await retry.state()).payment_status, 'failed');
await processStripeEvent(retry.paid, sql);
assert.equal((await retry.state()).payment_status, 'paid', 'Settlement can recover a failed attempt');

const cancelled = await fixture();
await sql`update one_reservations set status = 'cancelled' where request_code = ${cancelled.code}`;
await processStripeEvent(cancelled.paid, sql);
assert.equal((await cancelled.state()).status, 'cancelled', 'Payment does not reopen a cancelled booking');

for (let i = 0; i < 5; i++) {
  const race = await fixture();
  await processStripeEvent(race.paid, sql);
  await Promise.all([
    processStripeEvent(race.paid, sql), processStripeEvent(race.refund(12000), sql),
    processStripeEvent(race.failed, sql),
  ]);
  assert.deepEqual(await race.state(), {
    status: 'confirmed', payment_status: 'refunded', ledger_status: 'refunded', payment_count: 1,
  });
}
console.log('PASS: duplicate settlement, late failure, partial/full refund, settlement replay after recorded refund, recovery after failure, cancelled booking preservation, and five concurrent delivery races. Isolated fictional fixtures; no Stripe calls.');
process.exit(0);
