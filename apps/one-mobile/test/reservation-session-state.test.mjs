import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reservationSession, updateSessionDraft, updateSessionReceipt } from '../src/reservation-session-state.ts';

const initial = { pickup: '', email: '', fullName: '' };
const receipt = { requestCode: 'ONE-FIXTURE', channel: 'one-api' };

test('sign-out and account changes start without another passenger contact details or receipt', () => {
  let old = reservationSession('passenger-a', initial);
  old = updateSessionDraft(old, 'passenger-a', { pickup: 'Private pickup', email: 'a@example.invalid' });
  old = updateSessionReceipt(old, 'passenger-a', receipt);
  for (const owner of [null, 'passenger-b']) {
    const next = reservationSession(owner, initial);
    assert.deepEqual(next.draft, initial);
    assert.equal(next.receipt, null);
    assert.notEqual(next.draft, initial);
  }
  assert.equal(old.receipt, receipt);
});

test('late reservation responses from a signed-out account cannot enter the current session', () => {
  const current = reservationSession('passenger-b', initial);
  assert.equal(updateSessionReceipt(current, 'passenger-a', receipt), current);
  assert.equal(updateSessionDraft(current, 'passenger-a', { email: 'a@example.invalid' }), current);
  assert.equal(updateSessionReceipt(current, 'passenger-b', receipt).receipt, receipt);
});

test('a response from an earlier guest session stays rejected after signing in and out again', () => {
  const newGuest = reservationSession(null, initial, 2);
  assert.equal(updateSessionReceipt(newGuest, null, receipt, 0), newGuest);
  assert.equal(updateSessionDraft(newGuest, null, { email: 'previous@example.invalid' }, 0), newGuest);
  assert.equal(updateSessionReceipt(newGuest, null, receipt, 2).receipt, receipt);
});
