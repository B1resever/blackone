// Internal sandbox adapter only. No public endpoint. Caller must load verified
// reservation, consent and payment records from trusted server storage.
import { guaranteeSettlement, VIP_POLICY_VERSION } from './vip-financial-policy.mjs';

export function createVipSandboxGuarantee(stripe, secretKey) {
  if (!/^sk_test_/.test(secretKey || '')) throw new Error('test_key_required');
  const validId = id => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(id);
  function validate(record) {
    if (!record || !validId(record.id) || record.project !== 'B1_VIP' ||
        record.environment !== 'test' || record.policyVersion !== VIP_POLICY_VERSION ||
        record.serviceConsent !== true || record.holdConsent !== true || record.termsConsent !== true ||
        !Number.isSafeInteger(record.holdCents) || record.holdCents <= 0 ||
        record.holdCents > 100000000 || !/^pi_[a-zA-Z0-9]+$/.test(record.paidIntentId || ''))
      throw new Error('invalid_verified_reservation');
  }
  async function verifyPaid(record) {
    validate(record);
    const paid = await stripe.paymentIntents.retrieve(record.paidIntentId);
    if (paid.livemode !== false || paid.status !== 'succeeded' || paid.currency !== 'usd' ||
        paid.metadata?.project !== 'B1_VIP' || paid.metadata?.reservation_id !== record.id ||
        paid.amount_received < record.holdCents || typeof paid.customer !== 'string' ||
        typeof paid.payment_method !== 'string') throw new Error('invalid_service_payment');
    return paid;
  }
  return {
    async authorize(record) {
      const paid = await verifyPaid(record);
      if (!Number.isSafeInteger(record.pickupAtMs) || !Number.isSafeInteger(record.endAtMs) ||
          record.pickupAtMs < Date.now() || record.pickupAtMs > Date.now()+86400000 ||
          record.endAtMs < record.pickupAtMs || record.endAtMs > Date.now()+172800000)
        throw new Error('outside_authorization_window');
      return stripe.paymentIntents.create({
        amount:record.holdCents,currency:'usd',customer:paid.customer,
        payment_method:paid.payment_method,payment_method_types:['card'],
        capture_method:'manual',confirm:true,off_session:true,
        metadata:{project:'B1_VIP',purpose:'security_hold',reservation_id:record.id,policy_version:VIP_POLICY_VERSION}
      },{idempotencyKey:'b1-vip-test-hold-'+record.id});
    },
    async settle(record, intentId, damageCents, evidenceReference) {
      await verifyPaid(record);
      if (record.closed !== true || !/^pi_[a-zA-Z0-9]+$/.test(intentId || '')) throw new Error('closure_required');
      if (damageCents > 0 && !validId(evidenceReference)) throw new Error('damage_evidence_required');
      const hold=await stripe.paymentIntents.retrieve(intentId);
      if (hold.livemode !== false || hold.currency !== 'usd' || hold.capture_method !== 'manual' ||
          hold.metadata?.project !== 'B1_VIP' || hold.metadata?.purpose !== 'security_hold' ||
          hold.metadata?.reservation_id !== record.id || hold.amount !== record.holdCents ||
          hold.status !== 'requires_capture' || hold.amount_capturable !== record.holdCents)
        throw new Error('invalid_active_hold');
      const amounts=guaranteeSettlement({authorizedCents:hold.amount_capturable,documentedDamageCents:damageCents});
      const key='b1-vip-test-settlement-'+record.id;
      const result=amounts.captureCents===0
        ? await stripe.paymentIntents.cancel(intentId,{}, {idempotencyKey:key})
        : await stripe.paymentIntents.capture(intentId,{amount_to_capture:amounts.captureCents,final_capture:true},{idempotencyKey:key});
      return {intentId:result.id,status:result.status,...amounts};
    }
  };
}
