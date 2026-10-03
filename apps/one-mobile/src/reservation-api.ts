import { getMarketLabel, getVehicleLabel, ReservationDraft } from './reservation';
import type { ReservationReceipt } from './reservation-context';

const RESERVATION_DESK_ENDPOINT = 'https://formspree.io/f/xjgldvyj';

function createLocalRequestCode() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const random = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  return 'ONE-' + stamp + random;
}

async function submitToOneApi(draft: ReservationDraft, baseUrl: string): Promise<ReservationReceipt> {
  const response = await fetch(baseUrl.replace(/\/$/, '') + '/api/reservations', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(draft),
  });

  if (!response.ok) {
    throw new Error('ONE API reservation request failed');
  }

  const data = (await response.json()) as {
    reservation?: { request_code?: string };
  };
  const requestCode = data.reservation?.request_code;
  if (!requestCode) {
    throw new Error('ONE API did not return a reservation code');
  }

  return { requestCode, channel: 'one-api' };
}

async function submitToReservationDesk(draft: ReservationDraft): Promise<ReservationReceipt> {
  const requestCode = createLocalRequestCode();
  const response = await fetch(RESERVATION_DESK_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      _subject: 'ONE Reservation Request — ' + draft.fullName,
      request_code: requestCode,
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

  return { requestCode, channel: 'reservation-desk' };
}

export async function submitReservationRequest(draft: ReservationDraft): Promise<ReservationReceipt> {
  const apiBaseUrl = process.env.EXPO_PUBLIC_ONE_API_URL?.trim();

  if (apiBaseUrl) {
    try {
      return await submitToOneApi(draft, apiBaseUrl);
    } catch {
      return submitToReservationDesk(draft);
    }
  }

  return submitToReservationDesk(draft);
}
