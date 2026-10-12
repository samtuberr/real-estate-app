const { withAndroidManifest } = require('expo/config-plugins');

/** Validate during Android prebuild; Metro, Expo Go, web and iOS don't need this key. */
module.exports = function withRequiredAndroidMapsKey(config, { apiKey } = {}) {
  return withAndroidManifest(config, (config) => {
    if (!apiKey?.trim()) {
      throw new Error(
        'GOOGLE_MAPS_ANDROID_API_KEY is missing. Android maps crash at startup without it. ' +
          'Set it in the EAS environment selected by your build profile, or in .env.local for local builds, ' +
          'then rebuild the Android app. See README.md: Android Maps setup.',
      );
    }
    return config;
  });
};
