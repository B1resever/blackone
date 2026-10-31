export function getMapsServerKey(env: NodeJS.ProcessEnv = process.env): string | undefined {
  return env.GOOGLE_MAPS_SERVER_KEY?.trim() || env.GOOGLE_MAPS_SERVER_API_KEY?.trim() || undefined;
}
