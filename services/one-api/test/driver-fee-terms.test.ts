import assert from 'node:assert/strict';
import { test } from 'node:test';
import { driverFeeTerms } from '../src/driver-fee-terms.js';

test('Argentina earns 10 percent on trips from approval, including the membership-free first month', () => {
  const terms = driverFeeTerms('buenos-aires');
  assert.equal(terms.model, 'percentage');
  assert.equal(terms.percentPerTrip, 0.10);
  assert.equal(Math.round(7500000 * terms.percentPerTrip), 750000);
  assert.equal(terms.monthlyCapAmountMinor, null);
  assert.equal(terms.tripFeeExemptUntil, null);
});

test('South Florida retains its 5 percent trip fee and 25 dollar monthly cap', () => {
  const terms = driverFeeTerms('south-florida');
  assert.equal(terms.model, 'monthly_cap');
  assert.equal(terms.percentPerTrip, 0.05);
  assert.equal(terms.monthlyCapAmountMinor, 2500);
  assert.equal(terms.tripFeeExemptUntil, null);
});

test('unknown markets cannot silently receive another market fee schedule', () => {
  for (const market of ['', 'unknown', 'SOUTH-FLORIDA']) {
    assert.throws(() => driverFeeTerms(market), /unsupported_driver_fee_market/);
  }
});
