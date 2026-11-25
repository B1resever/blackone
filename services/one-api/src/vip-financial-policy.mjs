// B1 VIP only. Amounts are integer USD cents; timestamps are UTC milliseconds.
export const VIP_POLICY_VERSION = '2026-11-24';
export function cancellationQuote({paidCents,pickupAtMs,cancelledAtMs,completed=false}) {
  if (!Number.isSafeInteger(paidCents) || paidCents < 0 || paidCents > 100000000 ||
      !Number.isSafeInteger(pickupAtMs) || !Number.isSafeInteger(cancelledAtMs) ||
      typeof completed !== 'boolean') throw new RangeError('invalid_vip_cancellation');
  const remaining = pickupAtMs - cancelledAtMs;
  const penaltyBps = completed || remaining < 86400000 ? 10000 : remaining < 172800000 ? 3000 : 0;
  const penaltyCents = Math.round(paidCents * penaltyBps / 10000);
  return {policyVersion:VIP_POLICY_VERSION,penaltyBps,penaltyCents,refundCents:paidCents-penaltyCents};
}
export function guaranteeSettlement({authorizedCents,documentedDamageCents}) {
  if (![authorizedCents,documentedDamageCents].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=100000000) || documentedDamageCents>authorizedCents) throw new RangeError('invalid_vip_guarantee');
  return {captureCents:documentedDamageCents,releaseCents:authorizedCents-documentedDamageCents};
}
