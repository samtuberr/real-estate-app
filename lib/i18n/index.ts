import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import he from './locales/he.json';
import type { Locale } from './locales';

export const NAMESPACES = ['common', 'tabs', 'explore', 'saved', 'mortgage', 'learn', 'profile'] as const;

export const resources = { en, he } as const;

export function initI18n(locale: Locale) {
  if (i18n.isInitialized) {
    if (i18n.language !== locale) i18n.changeLanguage(locale);
    return i18n;
  }
  i18n.use(initReactI18next).init({
    resources,
    lng: locale,
    fallbackLng: 'en',
    ns: NAMESPACES,
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  return i18n;
}

export default i18n;
