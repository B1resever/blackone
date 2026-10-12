import Constants from 'expo-constants';

function normalize(value: string | undefined | null) {
  return value?.trim().replace(/\/$/, '') ?? '';
}

export function oneApiBaseUrl() {
  return normalize(
    process.env.EXPO_PUBLIC_ONE_API_URL ??
      (Constants.expoConfig?.extra?.oneApiUrl as string | undefined),
  );
}
