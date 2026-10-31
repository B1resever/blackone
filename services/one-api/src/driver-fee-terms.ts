export type DriverFeeTerms = {
  model: 'monthly_cap' | 'percentage';
  monthlyCapAmountMinor: number | null;
  percentPerTrip: number;
  tripFeeExemptUntil: null;
};

// Argentina's launch offer waives membership, not the percentage on trips.
// Membership billing is separate from the trip-fee exemption field.
export function driverFeeTerms(marketId: string): DriverFeeTerms {
  switch (marketId) {
    case 'south-florida':
      return { model: 'monthly_cap', monthlyCapAmountMinor: 2500, percentPerTrip: 0.05, tripFeeExemptUntil: null };
    case 'buenos-aires':
      return { model: 'percentage', monthlyCapAmountMinor: null, percentPerTrip: 0.10, tripFeeExemptUntil: null };
    default:
      throw new Error('unsupported_driver_fee_market');
  }
}
