import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTripLocation, isTripLocationFresh, prepareDriverCoordinates } from '../src/trip-location-state.ts';

const now = Date.parse('2026-10-31T12:00:00Z');
const position = { latitude: 25.7959, longitude: -80.2784, created_at: new Date(now).toISOString() };

test('only valid driver coordinates and timestamps can reach the map', () => {
  assert.deepEqual(normalizeTripLocation(position), position);
  for (const invalid of [null, {}, { ...position, latitude: NaN }, { ...position, longitude: Infinity },
    { ...position, latitude: 91 }, { ...position, longitude: -181 },
    { ...position, latitude: '25.7959' }, { ...position, created_at: 'invalid' }]) {
    assert.equal(normalizeTripLocation(invalid), null);
  }
  assert.ok(normalizeTripLocation({ ...position, latitude: 0, longitude: 0 }));
});

test('old and implausibly future positions are never labelled recent', () => {
  assert.equal(isTripLocationFresh(position, now), true);
  assert.equal(isTripLocationFresh(position, now + 60_000), true);
  assert.equal(isTripLocationFresh(position, now + 60_001), false);
  assert.equal(isTripLocationFresh({ ...position, created_at: new Date(now + 60_000).toISOString() }, now), false);
});

test('unavailable GPS heading/speed sentinels do not reject a valid location update', () => {
  assert.deepEqual(prepareDriverCoordinates({ latitude: 25.7, longitude: -80.2, accuracy: 12, heading: -1, speed: -1 }), {
    latitude: 25.7, longitude: -80.2, accuracyMeters: 12, headingDegrees: null, speedMps: null,
  });
  assert.deepEqual(prepareDriverCoordinates({ latitude: 0, longitude: 0, accuracy: 0, heading: 0, speed: 0 }), {
    latitude: 0, longitude: 0, accuracyMeters: 0, headingDegrees: 0, speedMps: 0,
  });
  assert.throws(() => prepareDriverCoordinates({ latitude: NaN, longitude: 1, accuracy: null, heading: null, speed: null }), /invalid_location/);
  assert.throws(() => prepareDriverCoordinates({ latitude: 0, longitude: 181, accuracy: null, heading: null, speed: null }), /invalid_location/);
});
