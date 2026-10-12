/** Decimal annual rates (0.05 = 5%), ILS amounts. No platform dependencies. */
export const BUYER_TYPES = ['first_home', 'upgrader', 'investor'] as const;
export type BuyerType = (typeof BUYER_TYPES)[number];
export const PLAN_IDS = ['stable', 'balanced', 'flexible'] as const;
export type PlanId = (typeof PLAN_IDS)[number];
export const TRACK_TYPES = [
  'fixed_unlinked',
  'prime',
  'fixed_linked',
  'variable5_unlinked',
  'variable5_linked',
] as const;
export type TrackType = (typeof TRACK_TYPES)[number];
export type RateTable = Record<TrackType, number>;
export type RepaymentMethod = 'annuity' | 'equal_principal';
export type Track = { type: TrackType; share: number; amount: number; annualRate: number; termYears: number };
export type PaymentRow = {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  indexation: number;
  balance: number;
};
export type Plan = {
  id: PlanId;
  loanAmount: number;
  tracks: Track[];
  schedule: PaymentRow[];
  monthlyPayment: number;
  peakPayment: number;
  totalRepayment: number;
  totalInterest: number;
  totalIndexation: number;
};
export type Fees = {
  /** Fractions of price, inclusive of any applicable VAT. */
  lawyerRate: number;
  agentRate: number;
  appraiser: number;
  advisor: number;
  moving: number;
  renovation: number;
};
export type PlanningInputs = {
  price: number;
  equity: number;
  monthlyIncome: number;
  monthlyObligations: number;
  buyerType: BuyerType;
  /** Explicit eligibility assumption, not inferred from the mortgage LTV category. */
  replacementTaxEligible: boolean;
  termYears: number;
  annualCpi: number;
  fees: Fees;
};
