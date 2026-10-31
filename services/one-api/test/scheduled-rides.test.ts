import assert from 'node:assert/strict';
import { test } from 'node:test';
import { scheduledRideInstant } from '../src/scheduled-rides.js';
import { quoteRequestSchema } from '../src/validation.js';
test('scheduled times follow the market timezone and accept 24-hour and AM/PM inputs', () => {
  assert.equal(scheduledRideInstant('2026-12-01', '14:00', 'south-florida'), Date.parse('2026-12-01T19:00:00Z'));
  assert.equal(scheduledRideInstant('2026-12-01', '2:00 PM', 'south-florida'), Date.parse('2026-12-01T19:00:00Z'));
  assert.equal(scheduledRideInstant('2026-12-01', '14:00', 'buenos-aires'), Date.parse('2026-12-01T17:00:00Z'));
});
test('invalid calendar dates, times and nonexistent daylight-saving appointments are rejected', () => {
  for (const [day, time] of [['2026-02-30','14:00'],['2026-12-01','25:00'],['2026-12-01','13:00 PM'],['2026-03-08','02:30']]) {
    assert.equal(scheduledRideInstant(day,time,'south-florida'), null);
  }
});
test('quotes reject immediate/past pickups and returns before the scheduled pickup', () => {
  const trip = { marketId:'south-florida', rideType:'one-way', pickup:'Miami Airport', dropoff:'Brickell Miami', pickupDate:'2099-12-01', pickupTime:'14:00', passengers:2, vehicleClass:'suv-black' };
  assert.equal(quoteRequestSchema.safeParse(trip).success, true);
  for (const patch of [{pickupDate:'2000-01-01'}, {pickupDate:'now'}, {pickupTime:'now'}, {rideType:'round-trip',returnDate:'2099-12-01',returnTime:'13:00'}]) {
    assert.equal(quoteRequestSchema.safeParse({...trip,...patch}).success,false);
  }
});
