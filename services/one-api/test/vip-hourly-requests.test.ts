import assert from 'node:assert/strict';
import test from 'node:test';
import { processVipHourlyRequest, vipHourlyRequestConfig, type VipHourlyRequestStore } from '../src/vip-hourly-requests.js';

const payload = {
  requestId: '239a20c3-bd1e-4b2f-88ed-5de19a6f748b',
  vehicleId: 'maybach-tifanni',
  pickupDate: '2027-03-03',
  pickupTime: '12:00',
  pickup: 'Miami Beach, FL',
  destination: 'Brickell, Miami, FL',
  hours: 3,
  passengers: 10,
  fullName: 'Example Rider',
  email: 'rider@example.com',
  phone: '305-555-0123',
};
const nearby = {
  distanceMeters: 10_000,
  durationSeconds: 1200,
  pickupLocation: { latitude: 25.79065, longitude: -80.13005 },
  dropoffLocation: { latitude: 25.768282, longitude: -80.193328 },
};

function options() {
  let routeCalls = 0;
  let routeBudget = 0;
  const saved = new Map<string, { request_fingerprint: string; quote: Parameters<VipHourlyRequestStore['save']>[0]['quote'] }>();
  const store: VipHourlyRequestStore = {
    async find(id) { return saved.get(id); },
    async useRouteBudget() { routeBudget += 1; return true; },
    async save(request) {
      const existing = saved.get(request.requestId);
      if (existing) return existing.request_fingerprint === request.fingerprint ? existing : undefined;
      const result = { request_fingerprint: request.fingerprint, quote: request.quote };
      saved.set(request.requestId, result);
      return result;
    },
  };
  return {
    store, saved, maximumCalls: 10,
    now: () => Date.parse('2026-11-23T00:00:00Z'),
    route: async () => { routeCalls += 1; return nearby; },
    counts: () => ({ routeCalls, routeBudget }),
  };
}

test('keeps VIP hourly intake inactive until DB, Maps and an approved call budget are configured', () => {
  const env = {
    B1_VIP_HOURLY_REQUESTS_ENABLED: 'true',
    DATABASE_URL: 'example-db',
    GOOGLE_MAPS_SERVER_API_KEY: 'example-maps',
    B1_VIP_HOURLY_MAPS_LIMIT_PER_HOUR: '30',
  };
  assert.deepEqual(vipHourlyRequestConfig(env), { databaseUrl: 'example-db', maximumCalls: 30 });
  for (const key of Object.keys(env)) assert.equal(vipHourlyRequestConfig({ ...env, [key]: '' }), null);
});

test('computes the package and authorization server-side and replays duplicate requests without another route', async () => {
  const deps = options();
  const result = await processVipHourlyRequest(payload, deps);
  assert.equal(result.statusCode, 201);
  assert.equal(result.body.status, 'requested');
  assert.equal(result.body.quote?.totalCents, 115000);
  assert.equal(result.body.quote?.securityHoldCents, 100000);
  assert.equal('guest_email' in result.body, false);
  assert.deepEqual(await processVipHourlyRequest({ ...payload, email: payload.email.toUpperCase() }, deps), result);
  const conflict = await processVipHourlyRequest({ ...payload, passengers: 9 }, deps);
  assert.equal(conflict.statusCode, 409);
  assert.deepEqual(deps.counts(), { routeCalls: 1, routeBudget: 1 });
  assert.equal(deps.saved.size, 1);
});

test('does not spend Maps calls for stale dates, nonexistent local times, unverified capacity or tampered quotes', async () => {
  const deps = options();
  for (const [input, status] of [
    [{ ...payload, pickupDate: '2025-11-23' }, 422],
    [{ ...payload, pickupDate: '2027-03-14', pickupTime: '02:30' }, 422],
    [{ ...payload, vehicleId: 'cadillac-escalade' }, 409],
    [{ ...payload, passengers: 11 }, 400],
    [{ ...payload, totalCents: 1 }, 400],
  ] as const) {
    assert.equal((await processVipHourlyRequest(input, deps)).statusCode, status);
  }
  assert.deepEqual(deps.counts(), { routeCalls: 0, routeBudget: 0 });
});

test('bounds Maps spend, fails closed on missing coordinates and rejects destinations outside the radius', async () => {
  const deps = options();
  const overBudget = { ...deps, store: { ...deps.store, useRouteBudget: async () => false } };
  assert.deepEqual(await processVipHourlyRequest(payload, overBudget), {
    statusCode: 429, body: { error: 'vip_quote_limit' },
  });
  assert.deepEqual(deps.counts(), { routeCalls: 0, routeBudget: 0 });

  const noCoordinates = { ...deps, route: async () => ({ distanceMeters: 1, durationSeconds: 1 }) };
  assert.deepEqual(await processVipHourlyRequest(payload, noCoordinates), {
    statusCode: 503, body: { error: 'route_unavailable' },
  });

  const distant = { ...deps, route: async () => ({
    ...nearby, dropoffLocation: { latitude: 26.71534, longitude: -80.05337 },
  }) };
  assert.deepEqual(await processVipHourlyRequest(payload, distant), {
    statusCode: 422, body: { error: 'hourly_radius_exceeded' },
  });
  assert.equal(deps.saved.size, 0);
});
