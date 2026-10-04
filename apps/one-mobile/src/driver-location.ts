import * as Location from 'expo-location';
import type { LocationSubscription } from 'expo-location';
import { postDriverLocation } from './auth-client';

export async function startOneDriverLocationSharing(
  requestCode: string,
  onUpdate?: (message: string) => void,
): Promise<LocationSubscription> {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (permission.status !== 'granted') {
    throw new Error('location_permission_denied');
  }

  const subscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 15,
    },
    async (location) => {
      try {
        await postDriverLocation({
          requestCode,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracyMeters: location.coords.accuracy,
          headingDegrees: location.coords.heading,
          speedMps: location.coords.speed,
        });
        onUpdate?.('Live location shared · ' + new Date().toLocaleTimeString());
      } catch {
        onUpdate?.('ONE could not update live location.');
      }
    },
  );

  return subscription;
}
