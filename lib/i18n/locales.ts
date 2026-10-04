import { getLocales } from 'expo-localization';

export const SUPPORTED_LOCALES = ['he', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

const RTL_LOCALES: readonly Locale[] = ['he'];

export function isRtlLocale(locale: Locale) {
  return RTL_LOCALES.includes(locale);
}

/** Hebrew for `he-*` (and legacy `iw-*`) devices, English otherwise (spec §6). */
export function getDeviceLocale(): Locale {
  const code = getLocales()[0]?.languageCode?.toLowerCase();
  return code === 'he' || code === 'iw' ? 'he' : 'en';
}

/** BCP-47 tag used for Intl formatting. */
export function intlLocale(locale: Locale) {
  return locale === 'he' ? 'he-IL' : 'en-IL';
}
