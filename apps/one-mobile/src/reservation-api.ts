import { ReservationDraft } from './reservation';
import type { ReservationReceipt } from './reservation-context';
import { getSessionToken } from './auth-client';

export type QuotePreview = {
  status: 'quoted' | 'manual_confirmation' | 'rate_card_required';
  amountMinor: number | null;
  currency: string;
  distanceMeters?: number | null;
  durationSeconds?: number | null;
  message?: string;
};

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

  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
    reservation?: { request_code?: string; ride_code?: string | null };
    quote?: QuotePreview;
  };

  if (!response.ok) {
    throw new Error(data.error ?? 'reservation_failed');
  }

  const requestCode = data.reservation?.request_code;
  if (!requestCode) {
    throw new Error('reservation_code_missing');
  }

  return {
    requestCode,
    rideCode: data.reservation?.ride_code ?? null,
    channel: 'one-api',
    quoteStatus: data.quote?.status,
    amountMinor: data.quote?.amountMinor ?? null,
    currency: data.quote?.currency ?? null,
  };
}

export async function submitReservationRequest(draft: ReservationDraft): Promise<ReservationReceipt> {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    throw new Error('one_api_not_configured');
  }

  return submitToOneApi(draft, apiBaseUrl);
}

export async function createCheckoutUrl(requestCode: string, email: string): Promise<string> {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) throw new Error('one_api_not_configured');

  const token = await getSessionToken();
  const response = await fetch(apiBaseUrl + '/one/api/create-checkout-session', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: JSON.stringify({ requestCode, email }),
  });

  const data = (await response.json().catch(() => ({}))) as {
    checkoutUrl?: string | null;
    error?: string;
  };

  if (!response.ok || !data.checkoutUrl) {
    throw new Error(data.error ?? 'checkout_failed');
  }

  return data.checkoutUrl;
}
