/**
 * B1 LAB marketplace economics — integer-cent calculations, no payment execution.
 * Rates are configurable proposals, not approved commercial prices.
 */
export type JobSettlementInput = {
  grossCents: number;
  commissionBps: number;
  refundCents?: number;
};
export type JobSettlement = {
  grossCents: number;
  refundCents: number;
  netServiceCents: number;
  platformCommissionCents: number;
  professionalAmountCents: number;
};
export function calculateJobSettlement(input: JobSettlementInput): JobSettlement {
  const { grossCents, commissionBps, refundCents = 0 } = input;
  for (const [name, value] of Object.entries({grossCents, commissionBps, refundCents})) {
    if (!Number.isSafeInteger(value)) throw new RangeError(name + " must be a safe integer");
  }
  if (grossCents < 0 || refundCents < 0 || refundCents > grossCents) {
    throw new RangeError("Invalid gross/refund amount");
  }
  if (commissionBps < 0 || commissionBps > 10000) {
    throw new RangeError("Commission must be between 0 and 10000 basis points");
  }
  const netServiceCents = grossCents - refundCents;
  const platformCommissionCents = Math.round(netServiceCents * commissionBps / 10000);
  const professionalAmountCents = netServiceCents - platformCommissionCents;
  return {grossCents,refundCents,netServiceCents,platformCommissionCents,professionalAmountCents};
}
export function calculateMonthlyPlatformRevenue(input: {
  subscriptionCents: number;
  settlements: readonly JobSettlement[];
}): number {
  if (!Number.isSafeInteger(input.subscriptionCents) || input.subscriptionCents < 0) {
    throw new RangeError("Invalid subscription");
  }
  const total = input.settlements.reduce((sum,s) => sum + s.platformCommissionCents, input.subscriptionCents);
  if (!Number.isSafeInteger(total)) throw new RangeError("Revenue overflow");
  return total;
}
// Settlement is a quote/reconciliation helper, not a Stripe charge, payout,
// invoice, tax calculation, escrow service, or proof of completion.
