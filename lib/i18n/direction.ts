import { DevSettings, I18nManager, Platform } from 'react-native';
import * as Updates from 'expo-updates';

import { isRtlLocale, type Locale } from './locales';

/** True when the native layout direction already matches the locale. */
export function directionMatches(locale: Locale) {
  if (Platform.OS === 'web') return true;
  return I18nManager.isRTL === isRtlLocale(locale);
}

/**
 * Sets the layout direction for a locale. On native, RTL only takes effect after
 * a reload (spec §6), so callers must call `reloadApp()` when this returns true.
 */
export function applyDirection(locale: Locale): boolean {
  const rtl = isRtlLocale(locale);
  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = rtl ? 'rtl' : 'ltr';
      document.documentElement.lang = locale;
    }
    return false;
  }
  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);
  return I18nManager.isRTL !== rtl;
}

export async function reloadApp() {
  if (__DEV__) {
    DevSettings.reload();
    return;
  }
  await Updates.reloadAsync();
}
