import { intlLocale, type Locale } from '@/lib/i18n/locales';

export function formatCurrency(value: number, locale: Locale, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
    ...options,
  }).format(value);
}

export function formatNumber(value: number, locale: Locale, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(intlLocale(locale), options).format(value);
}

export function formatDate(value: Date | string, locale: Locale, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(intlLocale(locale), options ?? { dateStyle: 'medium' }).format(
    typeof value === 'string' ? new Date(value) : value,
  );
}
