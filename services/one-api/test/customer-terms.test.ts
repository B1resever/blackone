import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { acceptanceNetworkIp, acceptsCurrentCustomerTerms, customerTerms } from '../src/customer-terms.js';
import handler from '../api/customer-terms.js';

test('acceptance requires the exact current document version/hash and an explicit boolean', () => {
  const accepted = {accepted:true,version:customerTerms.version,sha256:customerTerms.sha256};
  assert.equal(acceptsCurrentCustomerTerms(accepted),true);
  for (const patch of [{accepted:false},{accepted:'true'},{version:'old'},{sha256:'changed'}]) {
    assert.equal(acceptsCurrentCustomerTerms({...accepted,...patch}),false);
  }
  assert.equal(acceptsCurrentCustomerTerms(null),false);
  assert.equal(customerTerms.sha256,createHash('sha256').update(JSON.stringify(customerTerms.documents)).digest('hex'));
});
test('IP comes only from the server network boundary, never from acceptance payload', () => {
  const req = {headers:{'x-forwarded-for':'203.0.113.8'},socket:{remoteAddress:'127.0.0.1'},body:{ip:'198.51.100.2'}} as unknown as VercelRequest;
  assert.equal(acceptanceNetworkIp(req,false),'127.0.0.1');
  assert.equal(acceptanceNetworkIp(req,true),'203.0.113.8');
  req.headers['x-forwarded-for']='not-an-ip';
  assert.equal(acceptanceNetworkIp(req,true),null);
});
test('documents are public but an anonymous client cannot manufacture account acceptance', async () => {
  let status=0; let payload:any;
  const res={setHeader(){},status(n:number){status=n;return this;},json(v:unknown){payload=v;return this;}} as unknown as VercelResponse;
  await handler({method:'GET',headers:{}} as VercelRequest,res);
  assert.equal(status,200);assert.equal(payload.acceptance,null);
  assert.equal(payload.sha256,customerTerms.sha256);
  await handler({method:'POST',headers:{},body:{accepted:true}} as VercelRequest,res);
  assert.equal(status,401);
});
