import { getMarketLabel, getVehicleLabel, ReservationDraft } from './reservation';

const RESERVATION_ENDPOINT = 'https://formspree.io/f/xjgldvyj';

export async function submitReservationRequest(draft: ReservationDraft): Promise<void> {
  const response = await fetch(RESERVATION_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      _subject: `ONE Reservation Request — ${draft.fullName}`,
      source: 'ONE iOS/Android App',
      full_name: draft.fullName,
      email: draft.email,
      phone: draft.phone,
      market: getMarketLabel(draft.marketId),
      ride_type: draft.rideType,
      pickup_location: draft.pickup,
      dropoff_location: draft.rideType === 'hourly' ? 'Hourly service' : draft.dropoff,
      pickup_date: draft.pickupDate,
      pickup_time: draft.pickupTime,
      passengers: draft.passengers,
      vehicle_class: getVehicleLabel(draft.vehicleClass),
      additional_notes: draft.notes,
      status: 'NEW_APP_RESERVATION_REQUEST',
    }),
  });

  if (!response.ok) {
    throw new Error('Reservation request could not be sent.');
  }
}
