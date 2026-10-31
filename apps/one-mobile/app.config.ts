import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  // A separately restricted Android SDK key; never use the server routing key here.
  const androidMapsKey = process.env.ONE_ANDROID_MAPS_API_KEY?.trim();
  const plugins: NonNullable<ExpoConfig['plugins']> = [...(config.plugins ?? [])];
  plugins.push(['react-native-maps', androidMapsKey ? { androidGoogleMapsApiKey: androidMapsKey } : {}]);
  return {
    ...config,
    name: config.name ?? 'ONE',
    slug: config.slug ?? 'blackonegroup',
    plugins,
    extra: { ...config.extra, oneAndroidMapsConfigured: Boolean(androidMapsKey) },
  };
};
