import type { Address } from '@/lib/domain/types';
import type { Locale } from '@/lib/i18n/locales';

/** "Rothschild 12" — Israeli order (street, then number) in both languages. */
export function formatStreet(a: Address, locale: Locale) {
  return a.number ? `${a.street[locale]} ${a.number}` : a.street[locale];
}

/** "Old North, Tel Aviv-Yafo" */
export function formatArea(a: Address, locale: Locale) {
  return a.neighborhood ? `${a.neighborhood[locale]}, ${a.city[locale]}` : a.city[locale];
}
