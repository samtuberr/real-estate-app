/**
 * Standard new residential purchases only; not refinancing, additional secured
 * borrowing, subsidized schemes, foreign residents, or bank approval logic.
 * BOI directive 329; checked 2026-10-12. Inject an updated config in backend B4.
 */
export const REGULATION = {
  version: 'boi-329-2026-10-12',
  checkedAt: '2026-10-12',
  source: 'https://www.boi.org.il/roles/supervisionregulation/circulars/cir2852/',
  maxLtv: { first_home: 0.75, upgrader: 0.7, investor: 0.5 },
  maxPaymentRatio: 0.5,
  recommendedPaymentRatio: 0.33,
  minFixedShare: 0.3334,
  maxVariableShare: 0.6666,
  maxTermYears: 30,
  /** Product calculator range, not a statutory minimum. */
  minTermYears: 4,
} as const;
export type Regulation = {
  version: string;
  checkedAt: string;
  source: string;
  maxLtv: Record<'first_home' | 'upgrader' | 'investor', number>;
  maxPaymentRatio: number;
  recommendedPaymentRatio: number;
  minFixedShare: number;
  maxVariableShare: number;
  minTermYears: number;
  maxTermYears: number;
};
