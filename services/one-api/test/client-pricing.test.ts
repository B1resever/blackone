import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateClientQuote, calculateClientWaiting } from '../src/client-pricing.js';
import { calculateQuote } from '../src/pricing.js';

// Fictional rates and rectangles; not B1 production prices or coverage.
const card = {
  version: 'test-only', marketId: 'south-florida', currency: 'USD',
  effectiveFrom: '2030-01-01T00:00:00Z', effectiveTo: '2031-01-01T00:00:00Z',
  areas: [{ id: 'a', south: 10, north: 11, west: 10, east: 11 },
    { id: 'b', south: 12, north: 13, west: 12, east: 13 }],
  rates: [{ pickupAreaId: 'a', dropoffAreaId: 'b', vehicleClass: 'suv-black',
    minimumMinor: 10000, baseMinor: 2000, perMileMinor: 200, perMinuteMinor: 50 }],
  adjustments: [{ id: 'event', startsAt: '2030-06-01T00:00:00Z', endsAt: '2030-06-02T00:00:00Z', areaIds: ['b'], multiplierBps: 15000 }],
};
const input = { marketId: 'south-florida', vehicleClass: 'suv-black', rideType: 'one-way',
  pickupAt: Date.parse('2030-06-01T17:00:00Z'), distanceMeters: 1609.344, durationSeconds: 600,
  pickupLocation: { latitude: 10.5, longitude: 10.5 }, dropoffLocation: { latitude: 12.5, longitude: 12.5 } };
const quote = (c = card, i = input) => calculateClientQuote(JSON.stringify(c), i);

test('area minimum replaces a lower mileage total; event applies once above that floor', () => {
  const result = quote();
  assert.equal(result?.amountMinor, 15000);
  assert.equal(result?.status, 'quoted');
});
test('long route exceeds minimum and overlapping event/demand windows use highest uplift', () => {
  const c = structuredClone(card);
  c.adjustments.push({ ...c.adjustments[0], id: 'demand', multiplierBps: 20000 });
  assert.equal(quote(c, { ...input, distanceMeters: 1609.344 * 100 })?.amountMinor, 45000);
});
test('event ends at its boundary and cannot lower the ordinary zone rate', () => {
  assert.equal(quote(card, { ...input, pickupAt: Date.parse('2030-06-02T00:00:00Z') })?.amountMinor, 10000);
  const c = structuredClone(card); c.adjustments[0].multiplierBps = 9999;
  assert.equal(quote(c)?.status, 'manual_confirmation');
});
test('outside area, ambiguous areas, missing metrics and unpriced class fail closed', () => {
  assert.equal(quote(card, { ...input, dropoffLocation: { latitude: 30, longitude: 30 } })?.status, 'manual_confirmation');
  const c = structuredClone(card); c.areas.push({ ...c.areas[0], id: 'overlap' });
  assert.equal(quote(c)?.status, 'manual_confirmation');
  assert.equal(quote(card, { ...input, durationSeconds: NaN })?.status, 'manual_confirmation');
  assert.equal(quote(card, { ...input, vehicleClass: 'xl' })?.status, 'manual_confirmation');
});
test('invalid JSON, expired card and unpriced round trip/hourly never fall back', () => {
  assert.equal(calculateClientQuote('{', input)?.status, 'manual_confirmation');
  assert.equal(quote(card, { ...input, pickupAt: Date.parse(card.effectiveTo) })?.status, 'manual_confirmation');
  for (const rideType of ['round-trip', 'hourly']) assert.equal(quote(card, { ...input, rideType })?.status, 'manual_confirmation');
  assert.equal(calculateClientQuote(undefined, input), undefined);
});
test('duplicate pair rates and unknown event areas cannot silently select a price', () => {
  const c = structuredClone(card); c.rates.push({ ...c.rates[0] });
  assert.equal(quote(c)?.status, 'manual_confirmation');
  const other = structuredClone(card); other.adjustments[0].areaIds = ['unknown'];
  assert.equal(quote(other)?.status, 'manual_confirmation');
});
test('customer waiting excludes grace, charges started minutes and rejects bad input', () => {
  assert.equal(calculateClientWaiting(900, 900, 150), 0);
  assert.equal(calculateClientWaiting(901, 900, 150), 150);
  assert.equal(calculateClientWaiting(4500, 900, 150), 9000);
  assert.throws(() => calculateClientWaiting(-1, 900, 150));
});

test('configured zone pricing integrates without DB and malformed config cannot fall back', async () => {
  const prior = process.env.ONE_CLIENT_PRICING_JSON;
  try {
    process.env.ONE_CLIENT_PRICING_JSON = JSON.stringify(card);
    const args = { marketId: input.marketId, vehicleClass: input.vehicleClass,
      rideType: 'one-way' as const, hourlyHours: 0, pickupAt: input.pickupAt,
      route: { distanceMeters: input.distanceMeters, durationSeconds: input.durationSeconds,
        pickupLocation: input.pickupLocation, dropoffLocation: input.dropoffLocation } };
    assert.equal((await calculateQuote(args)).amountMinor, 15000);
    process.env.ONE_CLIENT_PRICING_JSON = '{';
    assert.equal((await calculateQuote(args)).status, 'manual_confirmation');
  } finally {
    if (prior === undefined) delete process.env.ONE_CLIENT_PRICING_JSON;
    else process.env.ONE_CLIENT_PRICING_JSON = prior;
  }
});
