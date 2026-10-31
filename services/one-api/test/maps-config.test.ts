import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import places from '../api/places.js';
import route from '../api/route.js';
import { getMapsServerKey } from '../src/maps-config.js';
import { getReadiness } from '../src/readiness.js';

test('Maps endpoints and readiness use the same alternate credential, including whitespace fallback', async (t) => {
  const originalFetch = globalThis.fetch;
  const previousPrimary = process.env.GOOGLE_MAPS_SERVER_KEY;
  const previousAlternate = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  t.after(() => {
    globalThis.fetch = originalFetch;
    if (previousPrimary === undefined) delete process.env.GOOGLE_MAPS_SERVER_KEY;
    else process.env.GOOGLE_MAPS_SERVER_KEY = previousPrimary;
    if (previousAlternate === undefined) delete process.env.GOOGLE_MAPS_SERVER_API_KEY;
    else process.env.GOOGLE_MAPS_SERVER_API_KEY = previousAlternate;
  });

  assert.equal(getMapsServerKey({}), undefined);
  assert.equal(getMapsServerKey({ GOOGLE_MAPS_SERVER_KEY: ' primary ', GOOGLE_MAPS_SERVER_API_KEY: 'alternate' }), 'primary');
  const requests: string[] = [];
  globalThis.fetch = async (input, options) => {
    const url = String(input);
    requests.push(url);
    assert.equal(new Headers(options?.headers).get('X-Goog-Api-Key'), 'test-alternate');
    return Response.json(url.includes('places.googleapis.com')
      ? { suggestions: [{ placePrediction: { placeId: 'airport', text: { text: 'Miami Airport' } } }] }
      : { routes: [{ distanceMeters: 12000, duration: '900s' }] });
  };

  for (const primary of [undefined, '  ']) {
    if (primary === undefined) delete process.env.GOOGLE_MAPS_SERVER_KEY;
    else process.env.GOOGLE_MAPS_SERVER_KEY = primary;
    process.env.GOOGLE_MAPS_SERVER_API_KEY = ' test-alternate ';
    const readiness = await getReadiness(process.env, async () => false);
    assert.equal(readiness.integrations.googleMaps, true);

    for (const [handler, body] of [
      [places, { input: 'Miami', marketId: 'south-florida' }],
      [route, { pickup: 'Miami Airport', dropoff: 'Brickell Miami' }],
    ] as const) {
      let status = 200;
      let payload: any;
      const response = {
        setHeader() {},
        status(value: number) { status = value; return this; },
        json(value: unknown) { payload = value; return this; },
      } as unknown as VercelResponse;
      await handler({ method: 'POST', headers: {}, body } as VercelRequest, response);
      assert.equal(status, 200);
      if (handler === places) assert.equal(payload.suggestions[0].id, 'airport');
      else assert.deepEqual(payload, { distanceMeters: 12000, durationSeconds: 900 });
    }
  }
  assert.equal(requests.length, 4);
});
