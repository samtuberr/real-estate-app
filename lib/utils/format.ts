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

/**
 * Short price for map pills: ₪2.4M, ₪850K. Hand-rolled because Hermes' Intl
 * doesn't reliably support `notation: 'compact'` on every platform.
 */
export function formatCompactPrice(value: number, locale: Locale) {
  const [scaled, suffix] = value >= 1_000_000 ? [value / 1_000_000, 'M'] : [value / 1_000, 'K'];
  const digits = value >= 1_000_000 && scaled < 10 ? 1 : 0;
  const n = formatNumber(Number(scaled.toFixed(digits)), locale, { maximumFractionDigits: digits });
  return `₪${n}${suffix}`;
}
