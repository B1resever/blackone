import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'one.session.token';

export type OneUser = {
  id: string;
  role: 'passenger' | 'driver' | 'admin' | 'dispatcher';
  fullName: string;
  email: string | null;
  phone: string | null;
  locale: string;
};

export async function getSessionToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setSessionToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
}

export async function clearSessionToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

function apiBaseUrl() {
  return process.env.EXPO_PUBLIC_ONE_API_URL?.trim().replace(/\/$/, '') ?? '';
}

async function api(path: string, options: RequestInit = {}) {
  const base = apiBaseUrl();
  if (!base) throw new Error('ONE API is not configured');
  const token = await getSessionToken();
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', 'Bearer ' + token);

  return fetch(base + '/one/api/' + path, { ...options, headers });
}

export async function registerAccount(input: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  locale?: string;
}) {
  const response = await api('auth-register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  const data = await response.json() as { user?: OneUser; session?: { token?: string }; error?: string };
  if (!response.ok || !data.user || !data.session?.token) throw new Error(data.error ?? 'registration_failed');
  await setSessionToken(data.session.token);
  return data.user;
}

export async function loginAccount(email: string, password: string) {
  const response = await api('auth-login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json() as { user?: OneUser; session?: { token?: string }; error?: string };
  if (!response.ok || !data.user || !data.session?.token) throw new Error(data.error ?? 'login_failed');
  await setSessionToken(data.session.token);
  return data.user;
}

export async function loadAccount() {
  const token = await getSessionToken();
  if (!token) return null;
  const response = await api('auth-me');
  if (!response.ok) {
    if (response.status === 401) await clearSessionToken();
    return null;
  }
  const data = await response.json() as { user?: OneUser };
  return data.user ?? null;
}

export async function logoutAccount() {
  try {
    await api('auth-logout', { method: 'POST', body: '{}' });
  } finally {
    await clearSessionToken();
  }
}

export async function deleteAccount() {
  const response = await api('auth-delete-account', { method: 'POST', body: '{}' });
  const data = await response.json() as { deleted?: boolean; message?: string; error?: string };
  if (!response.ok || !data.deleted) throw new Error(data.error ?? 'delete_failed');
  await clearSessionToken();
  return data.message ?? 'Account deleted.';
}


export async function activateDriverAccount(applicationCode: string, email: string, password: string) {
  const response = await api('driver-activate', {
    method: 'POST',
    body: JSON.stringify({ applicationCode, email, password }),
  });
  const data = await response.json() as { user?: OneUser; session?: { token?: string }; error?: string };
  if (!response.ok || !data.user || !data.session?.token) throw new Error(data.error ?? 'driver_activation_failed');
  await setSessionToken(data.session.token);
  return data.user;
}

export type DriverTrip = {
  request_code: string;
  market_id: string;
  ride_type: string;
  pickup_text: string;
  dropoff_text?: string | null;
  pickup_date_text: string;
  pickup_time_text: string;
  passenger_count: number;
  vehicle_class_id: string;
  guest_full_name?: string | null;
  guest_phone?: string | null;
  status: string;
  payment_status: string;
  quote_amount_minor?: number | null;
  quote_currency?: string | null;
};

export async function loadDriverTrips() {
  const response = await api('driver-jobs');
  if (!response.ok) throw new Error('driver_jobs_failed');
  const data = await response.json() as { trips?: DriverTrip[] };
  return data.trips ?? [];
}

export async function updateDriverTrip(requestCode: string, status: 'driver_en_route' | 'arrived' | 'passenger_onboard' | 'completed') {
  const response = await api('driver-trip-update', {
    method: 'POST',
    body: JSON.stringify({ requestCode, status }),
  });
  if (!response.ok) throw new Error('driver_trip_update_failed');
}
