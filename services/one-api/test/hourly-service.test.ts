import test from 'node:test';
import assert from 'node:assert/strict';
import { hourlyBaseMinor, hourlyOvertimeMinor } from '../src/hourly-service.js';
import { calculateQuote } from '../src/pricing.js';
import { quoteRequestSchema } from '../src/validation.js';

test('hourly minimum is $600 and each additional booked hour costs $200', () => {
  assert.equal(hourlyBaseMinor(3), 60000);
  assert.equal(hourlyBaseMinor(4), 80000);
  for (const n of [1, 2, 2.9, NaN, 25]) assert.throws(() => hourlyBaseMinor(n));
});
test('15 minute grace is excluded; total uses exact $200/60 with cent rounding', () => {
  assert.equal(hourlyOvertimeMinor(900), 0);
  assert.equal(hourlyOvertimeMinor(901), 333);
  assert.equal(hourlyOvertimeMinor(1020), 667);
  assert.equal(hourlyOvertimeMinor(4500), 20000);
  assert.throws(() => hourlyOvertimeMinor(-1));
});
test('API rejects bookings below three hours and returns terms without permitting premature payment', async () => {
  const trip = { marketId:'south-florida', vehicleClass:'suv-black', rideType:'hourly',
    pickup:'Miami hotel', pickupDate:'2099-12-01', pickupTime:'12:00', passengers:2 };
  assert.equal(quoteRequestSchema.safeParse({ ...trip, hourlyHours:2 }).success, false);
  assert.equal(quoteRequestSchema.safeParse({ ...trip, hourlyHours:3 }).success, true);
  for (const vehicleClass of ['suv-black', 'xl']) {
    const result = await calculateQuote({marketId:'south-florida', vehicleClass, rideType:'hourly', hourlyHours:3});
    assert.equal(result.status, 'manual_confirmation');
    assert.equal(result.amountMinor, null);
    if (result.status !== 'quoted') assert.equal(result.hourlyEstimateMinor, 60000);
  }
});
