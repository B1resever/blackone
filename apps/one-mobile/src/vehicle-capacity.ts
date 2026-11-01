// Scheduled road categories. Legacy reservations retain their original class labels.
export const vehiclePassengerLimits: Readonly<Record<string, number>> = {
  xl: 7,
  'suv-black': 6,
};

export function canCarryPassengers(vehicleClass: string | null, passengers: number): boolean {
  if (!vehicleClass || !Object.prototype.hasOwnProperty.call(vehiclePassengerLimits, vehicleClass)) return false;
  return Number.isInteger(passengers) && passengers >= 1 && passengers <= vehiclePassengerLimits[vehicleClass];
}
