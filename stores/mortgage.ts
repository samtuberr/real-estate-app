import { create } from 'zustand';
import type { PlanningInputs } from '@/lib/domain/mortgage/types';

export const DEMO_INPUTS: PlanningInputs = {
  price: 2_400_000,
  equity: 800_000,
  monthlyIncome: 30_000,
  monthlyObligations: 2_000,
  buyerType: 'first_home',
  replacementTaxEligible: false,
  termYears: 25,
  annualCpi: 0.02,
  fees: { lawyerRate: 0.0059, agentRate: 0, appraiser: 2_500, advisor: 8_000, moving: 5_000, renovation: 40_000 },
};

/** Session-only financial sandbox until M1 provides a consented, secure profile. */
export const useMortgageStore = create<{
  inputs: PlanningInputs;
  hasInputs: boolean;
  setInputs: (inputs: PlanningInputs) => void;
  clear: () => void;
}>()((set) => ({
  inputs: DEMO_INPUTS,
  hasInputs: false,
  setInputs: (inputs) => set({ inputs, hasInputs: true }),
  clear: () => set({ inputs: DEMO_INPUTS, hasInputs: false }),
}));
