import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeTripMessages } from '../src/trip-messages-state.ts';
const first = { id: 'message-1', created_at: '2026-10-31T12:00:00Z', body: 'At pickup' };
const second = { id: 'message-2', created_at: '2026-10-31T12:00:10Z', body: 'On my way' };

test('a stale poll cannot remove a just-sent message', () => {
  assert.deepEqual(mergeTripMessages([first, second], [first]), [first, second]);
});
test('send confirmation and polling never duplicate a message', () => {
  assert.deepEqual(mergeTripMessages([second], [first, second]), [first, second]);
});
test('messages remain ordered, replace updated records and leave the input untouched', () => {
  const current = [second, first];
  const updated = { ...first, body: 'At arrivals' };
  assert.deepEqual(mergeTripMessages(current, [updated]), [updated, second]);
  assert.deepEqual(current, [second, first]);
});
