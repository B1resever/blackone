import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getSessionToken } from './auth-client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function enableOneNotifications() {
  const base = process.env.EXPO_PUBLIC_ONE_API_URL?.trim().replace(/\/$/, '');
  const session = await getSessionToken();
  if (!base || !session) throw new Error('ONE account session required');

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('trips', {
      name: 'ONE Trip Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;

  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== 'granted') return { enabled: false as const, reason: 'permission_denied' as const };

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    return { enabled: false as const, reason: 'eas_project_missing' as const };
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

  const response = await fetch(base + '/one/api/push-register', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + session,
    },
    body: JSON.stringify({
      expoPushToken: token,
      platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'unknown',
    }),
  });

  if (!response.ok) throw new Error('push_registration_failed');

  return { enabled: true as const, token };
}
