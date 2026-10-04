import { useTranslation } from 'react-i18next';

import type { Locale } from './locales';

export function useLocale(): Locale {
  const { i18n } = useTranslation();
  return i18n.language === 'he' ? 'he' : 'en';
}
