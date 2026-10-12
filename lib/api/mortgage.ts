import type { RateTable } from '@/lib/domain/mortgage/types';

/** Illustrative fallback, deliberately NOT labeled a current rate or bank offer. */
export const FALLBACK_RATES: RateTable = {
  fixed_unlinked: 0.05,
  prime: 0.0475,
  fixed_linked: 0.0325,
  variable5_unlinked: 0.045,
  variable5_linked: 0.03,
};
export const FALLBACK_RATE_SNAPSHOT = {
  source: 'illustrative_fallback' as const,
  version: 'demo-rates-v1',
  rates: FALLBACK_RATES,
};

/** Repository boundary for B4's admin-maintained rates. No live API exists yet. */
export async function getMortgageRates() {
  return FALLBACK_RATE_SNAPSHOT;
}
