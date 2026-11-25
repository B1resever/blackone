import test from 'node:test';
import assert from 'node:assert/strict';
import { createVipSandboxGuarantee } from '../src/vip-sandbox-guarantee.mjs';
import { cancellationQuote } from '../src/vip-financial-policy.mjs';
function fixture() {
  const now=Date.now();
  const record={id:'test-reservation',project:'B1_VIP',environment:'test',policyVersion:'2026-11-24',serviceConsent:true,holdConsent:true,termsConsent:true,holdCents:100000,paidIntentId:'pi_paid',pickupAtMs:now+3600000,endAtMs:now+7200000,closed:true};
  const paid={livemode:false,status:'succeeded',currency:'usd',metadata:{project:'B1_VIP',reservation_id:record.id},amount_received:115000,customer:'cus_test',payment_method:'pm_test'};
  const hold={livemode:false,status:'requires_capture',currency:'usd',capture_method:'manual',metadata:{project:'B1_VIP',purpose:'security_hold',reservation_id:record.id},amount:100000,amount_capturable:100000};
  const calls=[];
  const stripe={paymentIntents:{
    retrieve:async id=>id==='pi_paid'?paid:hold,
    create:async (...args)=>{calls.push(['create',...args]);return {id:'pi_hold',status:'requires_capture'};},
    cancel:async (...args)=>{calls.push(['cancel',...args]);return {id:'pi_hold',status:'canceled'};},
    capture:async (...args)=>{calls.push(['capture',...args]);return {id:'pi_hold',status:'succeeded'};}
  }};
  return {record,paid,hold,calls,stripe,adapter:createVipSandboxGuarantee(stripe,'sk_test_mock')};
}
test('reject live key',()=>assert.throws(()=>createVipSandboxGuarantee({},'sk_live_mock'),/test_key_required/));
test('authorize manual capture, same saved card and stable idempotency key',async()=>{const f=fixture();await f.adapter.authorize(f.record);assert.equal(f.calls[0][1].capture_method,'manual');assert.equal(f.calls[0][1].payment_method,'pm_test');assert.equal(f.calls[0][2].idempotencyKey,'b1-vip-test-hold-test-reservation');});
test('missing consent blocks authorization',async()=>{const f=fixture();f.record.holdConsent=false;await assert.rejects(f.adapter.authorize(f.record),/invalid_verified_reservation/);assert.equal(f.calls.length,0);});
test('foreign project payment rejected',async()=>{const f=fixture();f.paid.metadata.project='B1_LAB';await assert.rejects(f.adapter.authorize(f.record),/invalid_service_payment/);assert.equal(f.calls.length,0);});
test('release without damage',async()=>{const f=fixture();const result=await f.adapter.settle(f.record,'pi_hold',0);assert.equal(f.calls[0][0],'cancel');assert.equal(result.releaseCents,100000);});
test('partial capture with evidence',async()=>{const f=fixture();const result=await f.adapter.settle(f.record,'pi_hold',25000,'incident-1');assert.equal(f.calls[0][1],'pi_hold');assert.equal(f.calls[0][2].amount_to_capture,25000);assert.equal(result.releaseCents,75000);});
test('reject damage without evidence',async()=>{const f=fixture();await assert.rejects(f.adapter.settle(f.record,'pi_hold',25000),/damage_evidence_required/);assert.equal(f.calls.length,0);});
test('reject open service settlement',async()=>{const f=fixture();f.record.closed=false;await assert.rejects(f.adapter.settle(f.record,'pi_hold',0),/closure_required/);assert.equal(f.calls.length,0);});
test('reject mismatched hold',async()=>{const f=fixture();f.hold.metadata.reservation_id='other';await assert.rejects(f.adapter.settle(f.record,'pi_hold',0),/invalid_active_hold/);assert.equal(f.calls.length,0);});
test('reject damages above hold',async()=>{const f=fixture();await assert.rejects(f.adapter.settle(f.record,'pi_hold',100001,'incident-1'),/invalid_vip_guarantee/);assert.equal(f.calls.length,0);});
test('cancellation exact boundaries',()=>{for(const [hours,refund] of [[48,100000],[47,70000],[24,70000],[23,0]])assert.equal(cancellationQuote({paidCents:100000,pickupAtMs:200000000,cancelledAtMs:200000000-hours*3600000}).refundCents,refund);});
