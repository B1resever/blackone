export type ProviderBillingMethod = "upfront" | "per_trip";

export const B1_PROVIDER_MONTHLY_FEE = 25;
export const B1_PROVIDER_TRIP_PERCENT = 0.05;

const money=(value:number)=>Math.round(value*100)/100;

export type TripFeeAllocation = {
  tripGross:number;
  fivePercent:number;
  currentMonthApplied:number;
  nextMonthCreditApplied:number;
  totalWithheld:number;
  providerNet:number;
  currentMonthPaidAfter:number;
  nextMonthCreditAfter:number;
};

export function allocateProviderTripFee(input:{
  tripGross:number;
  currentMonthPaid:number;
  nextMonthCredit:number;
}):TripFeeAllocation{
  const tripGross=Math.max(0,input.tripGross);
  const currentPaid=Math.min(B1_PROVIDER_MONTHLY_FEE,Math.max(0,input.currentMonthPaid));
  const nextCredit=Math.min(B1_PROVIDER_MONTHLY_FEE,Math.max(0,input.nextMonthCredit));
  const fivePercent=money(tripGross*B1_PROVIDER_TRIP_PERCENT);

  const currentRemaining=Math.max(0,B1_PROVIDER_MONTHLY_FEE-currentPaid);
  const currentMonthApplied=Math.min(fivePercent,currentRemaining);

  const remainingAfterCurrent=Math.max(0,fivePercent-currentMonthApplied);
  const nextRemaining=Math.max(0,B1_PROVIDER_MONTHLY_FEE-nextCredit);
  const nextMonthCreditApplied=Math.min(remainingAfterCurrent,nextRemaining);

  const totalWithheld=money(currentMonthApplied+nextMonthCreditApplied);

  return {
    tripGross:money(tripGross),
    fivePercent,
    currentMonthApplied:money(currentMonthApplied),
    nextMonthCreditApplied:money(nextMonthCreditApplied),
    totalWithheld,
    providerNet:money(tripGross-totalWithheld),
    currentMonthPaidAfter:money(currentPaid+currentMonthApplied),
    nextMonthCreditAfter:money(nextCredit+nextMonthCreditApplied)
  };
}
