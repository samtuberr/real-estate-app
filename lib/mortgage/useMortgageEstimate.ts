import { FALLBACK_RATE_SNAPSHOT } from '@/lib/api/mortgage';
import { useMortgageRates } from '@/lib/api/queries';
import { deriveAffordability } from '@/lib/domain/mortgage/affordability';
import { createPlan } from '@/lib/domain/mortgage/plans';
import { PLAN_IDS, type PlanningInputs } from '@/lib/domain/mortgage/types';
import { TAX_2026 } from '@/lib/domain/tax/brackets';
import { taxConfigCoversDate } from '@/lib/domain/tax/purchase';

export function useMortgageEstimate(inputs: PlanningInputs) {
  const { data = FALLBACK_RATE_SNAPSHOT } = useMortgageRates();
  const date = new Date().toISOString().slice(0, 10);
  if (!taxConfigCoversDate(TAX_2026, date)) return { estimate: null, rates: data.rates };
  const purchase = deriveAffordability(inputs, data.rates.fixed_unlinked, date);
  const plans = PLAN_IDS.map((id) =>
    createPlan(id, purchase.loanNeeded, inputs.termYears, data.rates, inputs.annualCpi),
  );
  return { estimate: { ...purchase, plans }, rates: data.rates };
}
