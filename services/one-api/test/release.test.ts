import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getReadiness } from '../src/readiness.js';
import { reservationRequestSchema } from '../src/validation.js';
import { hashPassword, verifyPassword } from '../src/auth.js';
import adminReservations from '../api/admin-reservations.js';
import driverJobs from '../api/driver-jobs.js';
import createReservation from '../api/reservations.js';

const configured = {
  DATABASE_URL: 'postgresql://example.invalid/one',
  GOOGLE_MAPS_SERVER_KEY: 'maps-example',
  STRIPE_SECRET_KEY: 'stripe-example',
  STRIPE_WEBHOOK_SECRET: 'webhook-example',
  ONE_ADMIN_API_TOKEN: 'admin-example',
  ONE_ALLOWED_ORIGINS: 'https://b1reserve.com',
  ONE_PAYMENT_SUCCESS_URL: 'https://b1reserve.com/payment-success.html',
  ONE_PAYMENT_CANCEL_URL: 'https://b1reserve.com/payment-cancelled.html',
};

test('release stays blocked when the database is absent, unreachable or unmigrated', async () => {
  let probed = false;
  const absent = await getReadiness({}, async () => { probed = true; return true; });
  assert.equal(absent.ready, false);
  assert.equal(probed, false);
  assert.equal((await getReadiness(configured, async () => false)).ready, false);
  const failed = await getReadiness(configured, async () => {
    throw new Error('provider error containing a private connection string');
  });
  assert.equal(failed.ready, false);
  assert.equal(JSON.stringify(failed).includes('private connection'), false);
});

test('release requires every integration and a successful schema probe', async () => {
  assert.equal((await getReadiness(configured, async () => true)).ready, true);
  for (const key of Object.keys(configured)) {
    const result = await getReadiness({ ...configured, [key]: '  ' }, async () => true);
    assert.equal(result.ready, false, key);
  }
});

const booking = {
  marketId: 'south-florida', rideType: 'one-way', pickup: 'Miami Airport',
  dropoff: 'Brickell Miami', pickupDate: '2026-12-01', pickupTime: '14:00',
  passengers: 2, vehicleClass: 'suv-black', fullName: 'ONE Test Passenger',
  email: 'passenger@example.com', phone: '+13055550100',
};

test('passenger reservation validation preserves scheduled and hourly booking contracts', () => {
  assert.equal(reservationRequestSchema.safeParse(booking).success, true);
  assert.equal(reservationRequestSchema.safeParse({ ...booking, dropoff: '' }).success, false);
  assert.equal(reservationRequestSchema.safeParse({ ...booking, rideType: 'hourly', dropoff: '', hourlyHours: 3 }).success, true);
  assert.equal(reservationRequestSchema.safeParse({ ...booking, rideType: 'round-trip' }).success, false);
  assert.equal(reservationRequestSchema.safeParse({ ...booking, rideType: 'round-trip', returnDate: '2026-12-02', returnTime: '10:00' }).success, true);
  for (const patch of [{ passengers: 0 }, { marketId: 'unknown' }, { vehicleClass: 'unknown' }, { email: 'invalid' }]) {
    assert.equal(reservationRequestSchema.safeParse({ ...booking, ...patch }).success, false);
  }
});

test('account passwords use independent salts and reject the wrong password', async () => {
  const password = 'one-test-password-123';
  const a = await hashPassword(password);
  const b = await hashPassword(password);
  assert.notEqual(a, b);
  assert.equal(await verifyPassword(password, a), true);
  assert.equal(await verifyPassword('incorrect', a), false);
  assert.equal(await verifyPassword(password, null), false);
});

async function call(handler: (req: VercelRequest, res: VercelResponse) => unknown, method: string, body?: unknown) {
  let code = 200;
  let payload: unknown;
  const req = { method, headers: {}, query: {}, body } as VercelRequest;
  const res = {
    setHeader() {},
    status(value: number) { code = value; return this; },
    json(value: unknown) { payload = value; return this; },
  } as unknown as VercelResponse;
  await handler(req, res);
  return { code, payload };
}

test('Operations and Driver APIs refuse unauthenticated access before querying reservations', async () => {
  assert.equal((await call(adminReservations, 'GET')).code, 401);
  assert.equal((await call(driverJobs, 'GET')).code, 401);
});

test('invalid passenger bookings fail before database access; wrong methods are rejected', async () => {
  assert.equal((await call(createReservation, 'POST', {})).code, 400);
  assert.equal((await call(createReservation, 'GET')).code, 405);
});
