import { serviceMarkets } from './markets';

export type RideType = 'one-way' | 'hourly' | 'round-trip';
export type VehicleClass = 'confort' | 'xl' | 'suv-black' | 'ultra-exclusive';

export type ReservationDraft = {
  marketId: (typeof serviceMarkets)[number]['id'];
  rideType: RideType;
  pickup: string;
  dropoff: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  hourlyHours: number;
  passengers: number;
  fullName: string;
  email: string;
  phone: string;
  vehicleClass: VehicleClass | null;
  airportPickup: boolean;
  flightNumber: string;
  pickupMeeting: 'curbside' | 'meet-and-greet';
  pickupInstructions: string;
  notes: string;
};

export const initialReservation: ReservationDraft = {
  marketId: 'south-florida',
  rideType: 'one-way',
  pickup: '',
  dropoff: '',
  pickupDate: '',
  pickupTime: '',
  returnDate: '',
  returnTime: '',
  hourlyHours: 2,
  passengers: 1,
  fullName: '',
  email: '',
  phone: '',
  vehicleClass: null,
  airportPickup: false,
  flightNumber: '',
  pickupMeeting: 'curbside',
  pickupInstructions: '',
  notes: '',
};

export const vehicleCatalog: Array<{
  id: VehicleClass;
  name: string;
  subtitle: string;
  passengers: string;
  luggage: string;
}> = [
  { id: 'suv-black', name: 'SUV BLACK', subtitle: 'Black luxury SUV · Escalade, Suburban, Tahoe, Yukon/Denali or equivalent', passengers: '1–6', luggage: 'Confirm luggage with B1' },
  { id: 'xl', name: 'XL', subtitle: 'Economical alternative · approved spacious vehicle', passengers: '1–7', luggage: 'Confirm luggage with B1' },
];

export function getMarketLabel(marketId: ReservationDraft['marketId']): string {
  return serviceMarkets.find((market) => market.id === marketId)?.label ?? marketId;
}

export function getVehicleLabel(vehicleClass: ReservationDraft['vehicleClass']): string {
  return vehicleCatalog.find((vehicle) => vehicle.id === vehicleClass)?.name ?? (vehicleClass === 'confort' ? 'CONFORT · previous reservation' : vehicleClass === 'ultra-exclusive' ? 'ULTRA EXCLUSIVE · previous reservation' : 'Not selected');
}

export function isTripDetailsComplete(draft: ReservationDraft): boolean {
  const hasDestination = draft.rideType === 'hourly' ? true : draft.dropoff.trim().length > 2;
  const hasReturn =
    draft.rideType !== 'round-trip' ||
    (draft.returnDate.trim().length > 0 && draft.returnTime.trim().length > 0);
  const hasHours = draft.rideType !== 'hourly' || draft.hourlyHours >= 1;

  return (
    draft.pickup.trim().length > 2 &&
    hasDestination &&
    draft.pickupDate.trim().length > 0 &&
    draft.pickupTime.trim().length > 0 &&
    hasReturn &&
    hasHours &&
    draft.fullName.trim().length > 2 &&
    draft.email.includes('@') &&
    draft.phone.trim().length >= 7 &&
    draft.passengers >= 1
  );
}
