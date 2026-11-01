import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateClientQuote, milesBetween } from '../src/client-pricing.js';
import { southFloridaPricing } from '../src/south-florida-pricing.js';

const base = { marketId:'south-florida', rideType:'one-way', vehicleClass:'suv-black',
  pickupAt:Date.parse('2026-11-10T17:00:00Z'), distanceMeters:12000, durationSeconds:1200,
  pickupLocation:{latitude:25.768282,longitude:-80.193328},
  dropoffLocation:{latitude:25.776,longitude:-80.188} };
const quote = (patch = {}) => calculateClientQuote(JSON.stringify(southFloridaPricing),{...base,...patch});
test('all four city areas have fixed category prices inside the same area', () => {
  for (const area of southFloridaPricing.areas) {
    assert.equal(quote({pickupLocation:area.center,dropoffLocation:area.center})?.amountMinor,14720);
    assert.equal(quote({pickupLocation:area.center,dropoffLocation:area.center,vehicleClass:'xl'})?.amountMinor,9500);
  }
});
test('overlapping Miami circles resolve by nearest center without random rates', () => {
  const result = quote();
  assert.equal(result?.status,'quoted');
  if (result?.status === 'quoted') assert.equal(result.pricing.pickupAreaId,'brickell-miami');
});
test('city crossings and points outside ten-mile coverage require a confirmed B1 extra', () => {
  assert.equal(quote({dropoffLocation:southFloridaPricing.areas[2].center})?.status,'manual_confirmation');
  assert.equal(quote({dropoffLocation:{latitude:27.5,longitude:-80.1}})?.status,'manual_confirmation');
  assert.ok(milesBetween(base.pickupLocation,{latitude:27.5,longitude:-80.1})>10);
});
test('verified Art Week applies fifty percent only to Miami and only during the scheduled window', () => {
  assert.equal(quote({pickupAt:Date.parse('2026-12-01T17:00:00Z')})?.amountMinor,22080);
  const center=southFloridaPricing.areas[2].center;
  assert.equal(quote({pickupAt:Date.parse('2026-12-01T17:00:00Z'),pickupLocation:center,dropoffLocation:center})?.amountMinor,14720);
  assert.equal(quote({pickupAt:Date.parse('2026-12-07T05:00:00Z')})?.amountMinor,14720);
});
