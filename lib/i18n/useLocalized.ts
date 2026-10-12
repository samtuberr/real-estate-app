import type { LocalizedText } from '@/lib/domain/types';

import { useLocale } from './useLocale';

/** Picks the active language from a `LocalizedText` (API content, addresses). */
export function useLocalized() {
  const locale = useLocale();
  return (text: LocalizedText | undefined) => (text ? text[locale] : '');
}
