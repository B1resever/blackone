import * as Location from 'expo-location';
import type { LocationSubscription } from 'expo-location';
import { postDriverLocation } from './auth-client';
import { prepareDriverCoordinates } from './trip-location-state';

export async function startOneDriverLocationSharing(
  requestCode: string,
  onUpdate?: (message: string) => void,
  signal?: AbortSignal,
): Promise<LocationSubscription> {
  if (signal?.aborted) throw new Error('location_cancelled');
  const permission = await Location.requestForegroundPermissionsAsync();
  if (signal?.aborted) throw new Error('location_cancelled');

  if (permission.status !== 'granted') {
    throw new Error('location_permission_denied');
  }

  let active = true;
  let sending = false;
  const subscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 15,
    },
    async (location) => {
      if (!active || signal?.aborted || sending) return;
      sending = true;
      try {
        await postDriverLocation({
          requestCode,
          ...prepareDriverCoordinates(location.coords),
        }, signal);
        if (active) onUpdate?.('Live location shared · ' + new Date().toLocaleTimeString());
      } catch {
        if (active) onUpdate?.('ONE could not update live location.');
      } finally {
        sending = false;
      }
    },
  );

  function remove() {
    if (!active) return;
    active = false;
    subscription.remove();
    signal?.removeEventListener('abort', remove);
  }
  signal?.addEventListener('abort', remove, { once: true });
  if (signal?.aborted) { remove(); throw new Error('location_cancelled'); }
  return { remove };
}
