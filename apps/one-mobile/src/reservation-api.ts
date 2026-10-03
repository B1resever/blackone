import { getMarketLabel, getVehicleLabel, ReservationDraft } from './reservation';
import type { ReservationReceipt } from './reservation-context';
import { getSessionToken } from './auth-client';
import { getSessionToken } from './auth-client';

const RESERVATION_DESK_ENDPOINT = 'https://formspree.io/f/xjgldvyj';

export type QuotePreview = {
  status: 'quoted' | 'manual_confirmation' | 'rate_card_required';
  amountMinor: number | null;
  currency: string;
  distanceMeters?: number | null;
  durationSeconds?: number | null;
  message?: string;
};

function createLocalRequestCode() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const random = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  return 'ONE-' + stamp + random;
}

function getApiBaseUrl() {
  return process.env.EXPO_PUBLIC_ONE_API_URL?.trim().replace(/\/$/, '') ?? '';
}

export async function fetchQuotePreview(draft: ReservationDraft): Promise<QuotePreview | null> {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl || !draft.vehicleClass) return null;

  try {
    const response = await fetch(apiBaseUrl + '/one/api/quotes', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(draft),
    });
    if (!response.ok) return null;
    return (await response.json()) as QuotePreview;
  } catch {
    return null;
  }
}

async function submitToOneApi(draft: ReservationDraft, baseUrl: string): Promise<ReservationReceipt> {
  const token = await getSessionToken();
  const response = await fetch(baseUrl + '/one/api/reservations', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: JSON.stringify(draft),
  });

  if (!response.ok) {
    throw new Error('ONE API reservation request failed');
  }

  const data = (await response.json()) as {
    reservation?: { request_code?: string };
    quote?: QuotePreview;
  };
  const requestCode = data.reservation?.request_code;
  if (!requestCode) {
    throw new Error('ONE API did not return a reservation code');
  }

  return {
    requestCode,
    channel: 'one-api',
    quoteStatus: data.quote?.status,
    amountMinor: data.quote?.amountMinor ?? null,
    currency: data.quote?.currency ?? null,
  };
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
      return_date: draft.rideType === 'round-trip' ? draft.returnDate : '',
      return_time: draft.rideType === 'round-trip' ? draft.returnTime : '',
      hourly_hours: draft.rideType === 'hourly' ? draft.hourlyHours : '',
      passengers: draft.passengers,
      vehicle_class: getVehicleLabel(draft.vehicleClass),
      additional_notes: draft.notes,
      status: 'NEW_APP_RESERVATION_REQUEST',
    }),
  });

  if (!response.ok) {
    throw new Error('Reservation request could not be sent.');
  }

  return {
    requestCode,
    channel: 'reservation-desk',
    quoteStatus: 'manual_confirmation',
    amountMinor: null,
    currency: draft.marketId === 'buenos-aires' ? 'ARS' : 'USD',
  };
}

export async function submitReservationRequest(draft: ReservationDraft): Promise<ReservationReceipt> {
  const apiBaseUrl = getApiBaseUrl();

  if (apiBaseUrl) {
    try {
      return await submitToOneApi(draft, apiBaseUrl);
    } catch {
      return submitToReservationDesk(draft);
    }
  }

  return submitToReservationDesk(draft);
}

export async function createCheckoutUrl(requestCode: string): Promise<string | null> {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) return null;

  const response = await fetch(apiBaseUrl + '/one/api/create-checkout-session', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requestCode }),
  });

  if (!response.ok) return null;
  const data = (await response.json()) as { checkoutUrl?: string | null };
  return data.checkoutUrl ?? null;
}
