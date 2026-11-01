import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { test } from 'node:test';
import { createDispatchOfferSchema, dispatchTokenSchema, dispatchTokenHash } from '../src/dispatch-offers.js';
import driver from '../api/driver-dispatch-offer.js';
import admin from '../api/admin-dispatch-offer.js';

test('dispatch invitations use opaque tokens and reject malformed tokens', () => {
  const token = randomBytes(32).toString('base64url');
  assert.equal(dispatchTokenSchema.parse(token),token);
  assert.match(dispatchTokenHash(token),/^[a-f0-9]{64}$/);
  assert.notEqual(dispatchTokenHash(token),token);
  for(const value of ['', 'ONE-TRIP-CODE', token+'x', '../'+token]) assert.equal(dispatchTokenSchema.safeParse(value).success,false);
});
test('Operations must specify positive driver remuneration, a brief summary and bounded expiry', () => {
  const valid={requestCode:'ONE-FIXTURE',driverAmountMinor:7500,summary:'Airport → Brickell'};
  assert.equal(createDispatchOfferSchema.parse(valid).expiresInMinutes,30);
  for(const patch of [{driverAmountMinor:0},{driverAmountMinor:1.5},{expiresInMinutes:0},{expiresInMinutes:121},{summary:'x'}]) assert.equal(createDispatchOfferSchema.safeParse({...valid,...patch}).success,false);
});
test('dispatch APIs require authenticated roles before accessing trip data', async () => {
  for (const handler of [driver,admin]) {
    let status=0;let body:any;const res={setHeader(){},status(value:number){status=value;return this;},json(value:unknown){body=value;return this;}};
    await handler({method:'POST',headers:{},body:{action:'preview',token:randomBytes(32).toString('base64url')}} as any,res as any);
    assert.equal(status,401);
    assert.ok(body.error);
    assert.equal('offer' in body,false);
  }
});
