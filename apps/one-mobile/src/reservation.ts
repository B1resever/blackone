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
  passengers: number;
  fullName: string;
  email: string;
  phone: string;
  vehicleClass: VehicleClass | null;
  notes: string;
};

export const initialReservation: ReservationDraft = {
  marketId: 'south-florida',
  rideType: 'one-way',
  pickup: '',
  dropoff: '',
  pickupDate: '',
  pickupTime: '',
  passengers: 1,
  fullName: '',
  email: '',
  phone: '',
  vehicleClass: null,
  notes: '',
};

export const vehicleCatalog: Array<{
  id: VehicleClass;
  name: string;
  subtitle: string;
  passengers: string;
  luggage: string;
}> = [
  {
    id: 'confort',
    name: 'CONFORT',
    subtitle: 'Premium everyday rides',
    passengers: '1–4',
    luggage: 'Up to 2 suitcases',
  },
  {
    id: 'xl',
    name: 'XL',
    subtitle: 'More room for passengers and luggage',
    passengers: '1–7',
    luggage: 'Up to 6 suitcases',
  },
  {
    id: 'suv-black',
    name: 'SUV BLACK',
    subtitle: 'Luxury SUV · 2022–2026',
    passengers: '1–6',
    luggage: 'Up to 6 suitcases',
  },
  {
    id: 'ultra-exclusive',
    name: 'ULTRA EXCLUSIVE',
    subtitle: 'Chauffeur · Hourly · Executive',
    passengers: 'Custom',
    luggage: 'Custom service',
  },
];

export function getMarketLabel(marketId: ReservationDraft['marketId']): string {
  return serviceMarkets.find((market) => market.id === marketId)?.label ?? marketId;
}

export function getVehicleLabel(vehicleClass: ReservationDraft['vehicleClass']): string {
  return vehicleCatalog.find((vehicle) => vehicle.id === vehicleClass)?.name ?? 'Not selected';
}

export function isTripDetailsComplete(draft: ReservationDraft): boolean {
  const hasDestination = draft.rideType === 'hourly' ? true : draft.dropoff.trim().length > 2;
  return (
    draft.pickup.trim().length > 2 &&
    hasDestination &&
    draft.pickupDate.trim().length > 0 &&
    draft.pickupTime.trim().length > 0 &&
    draft.fullName.trim().length > 2 &&
    draft.email.includes('@') &&
    draft.phone.trim().length >= 7 &&
    draft.passengers >= 1
  );
}
