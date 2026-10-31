import assert from 'node:assert/strict';
import { test } from 'node:test';
import { paymentReturnUrl } from '../src/payment-redirect.js';

test('payment redirects retain the configured destination and encode reservation data', () => {
  const code = 'ONE-TEST?next=https://example.invalid/&x=1';
  const url = new URL(paymentReturnUrl('https://b1reserve.com/payment-success.html?locale=es#receipt', code));
  assert.equal(url.origin, 'https://b1reserve.com');
  assert.equal(url.pathname, '/payment-success.html');
  assert.equal(url.searchParams.get('locale'), 'es');
  assert.deepEqual(url.searchParams.getAll('request_code'), [code]);
  assert.equal(url.hash, '#receipt');
});

test('payment redirects replace a stale reservation code instead of duplicating it', () => {
  const url = new URL(paymentReturnUrl('https://b1reserve.com/payment-cancelled.html?request_code=OLD', 'ONE-NEW'));
  assert.deepEqual(url.searchParams.getAll('request_code'), ['ONE-NEW']);
});

test('insecure, credential-bearing and malformed server payment destinations are refused', () => {
  for (const destination of [
    'http://b1reserve.com/payment-success.html',
    'javascript:alert(1)',
    'one://payment-success',
    'https://user:password@b1reserve.com/',
    '/payment-success.html',
    '',
  ]) {
    assert.throws(() => paymentReturnUrl(destination, 'ONE-TEST'), undefined, destination);
  }
});
