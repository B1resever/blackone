import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { fetchJsonResponse } from '../src/http-client.ts';

const url = 'https://one-test.invalid/one/api/reservations';

test('JSON requests preserve status, payload and authenticated request headers', async () => {
  const fetchMock = mock.method(globalThis, 'fetch', async (target, options) => {
    assert.equal(target, url);
    assert.equal(options.headers.Authorization, 'Bearer fixture-not-a-real-token');
    assert.equal(options.method, 'POST');
    return new Response(JSON.stringify({ error: 'quote_not_confirmed' }), { status: 409 });
  });
  try {
    const response = await fetchJsonResponse(url, { method: 'POST', headers: { Authorization: 'Bearer fixture-not-a-real-token' }, body: '{}' });
    assert.equal(response.ok, false);
    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), { error: 'quote_not_confirmed' });
    assert.equal(fetchMock.mock.callCount(), 1);
  } finally { fetchMock.mock.restore(); }
});

test('a stalled mutation times out once and never starts an automatic retry', async () => {
  let requestSignal;
  const fetchMock = mock.method(globalThis, 'fetch', async (_, options) => {
    requestSignal = options.signal;
    return new Promise(() => {});
  });
  try {
    await assert.rejects(fetchJsonResponse(url, { method: 'POST', body: '{}' }, 10), { name: 'TimeoutError' });
    assert.equal(requestSignal.aborted, true);
    assert.equal(fetchMock.mock.callCount(), 1);
  } finally { fetchMock.mock.restore(); }
});

test('the timeout includes a stalled response body after headers arrive', async () => {
  const fetchMock = mock.method(globalThis, 'fetch', async () => ({ ok: true, status: 200, json: () => new Promise(() => {}) }));
  try { await assert.rejects(fetchJsonResponse(url, {}, 10), { name: 'TimeoutError' }); }
  finally { fetchMock.mock.restore(); }
});

test('cancelled screens abort in-flight requests and already-cancelled screens do not fetch', async () => {
  const fetchMock = mock.method(globalThis, 'fetch', async () => new Promise(() => {}));
  try {
    const controller = new AbortController();
    const request = fetchJsonResponse(url, { signal: controller.signal });
    controller.abort();
    await assert.rejects(request, { name: 'AbortError' });
    await assert.rejects(fetchJsonResponse(url, { signal: controller.signal }), { name: 'AbortError' });
    assert.equal(fetchMock.mock.callCount(), 1);
  } finally { fetchMock.mock.restore(); }
});

test('empty and non-JSON failures remain errors instead of leaving callers waiting', async () => {
  const fetchMock = mock.method(globalThis, 'fetch', async () => new Response('<html>Unavailable</html>', { status: 503 }));
  try {
    const response = await fetchJsonResponse(url);
    assert.equal(response.ok, false);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {});
  } finally { fetchMock.mock.restore(); }
});

test('a successful non-JSON page cannot masquerade as an empty trip list or saved reservation', async () => {
  const fetchMock = mock.method(globalThis, 'fetch', async () => new Response('<html>Gateway</html>', { status: 200 }));
  try { await assert.rejects(fetchJsonResponse(url), /invalid_json_response/); }
  finally { fetchMock.mock.restore(); }
});
