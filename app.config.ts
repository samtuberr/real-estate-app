import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Static config lives in app.json. This file only injects secrets from EAS environment
 * variables so they're never committed (spec §13):
 * - GOOGLE_MAPS_ANDROID_API_KEY: Google Maps SDK for Android key used by react-native-maps.
 *   iOS uses Apple Maps and needs no key.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  plugins: [
    ...(config.plugins ?? []),
    ['react-native-maps', { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim() }],
    ['./plugins/withRequiredAndroidMapsKey', { apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim() }],
  ],
});
