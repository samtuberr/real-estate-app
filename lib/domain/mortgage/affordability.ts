import { REGULATION, type Regulation } from '../regulation/config';
import { TAX_2026, type TaxConfig } from '../tax/brackets';
import { purchaseCosts } from '../tax/purchase';
import { inRange, loanFromPayment } from './math';
import { BUYER_TYPES, type PlanningInputs } from './types';

/** Costs are cash-funded. The loan is never silently capped to hide an equity gap. */
export function assessPurchase(
  inputs: PlanningInputs,
  date: string,
  regulation: Regulation = REGULATION,
  tax: TaxConfig = TAX_2026,
) {
  inRange(inputs.price, 1, 100_000_000);
  inRange(inputs.equity, 0, 100_000_000);
  inRange(inputs.monthlyIncome, 0, 10_000_000);
  inRange(inputs.monthlyObligations, 0, 10_000_000);
  inRange(inputs.termYears, regulation.minTermYears, regulation.maxTermYears);
  inRange(inputs.annualCpi, 0, 0.2);
  if (!BUYER_TYPES.includes(inputs.buyerType)) throw new RangeError('Unknown buyer type');
  const costs = purchaseCosts(inputs.price, inputs.buyerType, inputs.replacementTaxEligible, inputs.fees, date, tax);
  const maxLoan = inputs.price * regulation.maxLtv[inputs.buyerType];
  const cashForPrice = Math.max(0, inputs.equity - costs.closingCosts);
  const loanNeeded = Math.max(0, inputs.price - cashForPrice);
  const requiredEquity = inputs.price - maxLoan + costs.closingCosts;
  const disposableIncome = Math.max(0, inputs.monthlyIncome - inputs.monthlyObligations);
  return {
    costs,
    loanNeeded,
    maxLoan,
    requiredEquity,
    disposableIncome,
    equityGap: Math.max(0, requiredEquity - inputs.equity),
    ltv: loanNeeded / inputs.price,
    recommendedPayment: disposableIncome * regulation.recommendedPaymentRatio,
  };
}

/**
 * Max price satisfies LTV, a conservative payment budget AND closing costs.
 * The representative constant rate is supplied by the caller; no hidden clock.
 */
export function deriveAffordability(
  inputs: PlanningInputs,
  annualRate: number,
  date: string,
  regulation: Regulation = REGULATION,
  tax: TaxConfig = TAX_2026,
) {
  const purchase = assessPurchase(inputs, date, regulation, tax);
  const incomeLimitedLoan = loanFromPayment(purchase.recommendedPayment, annualRate, inputs.termYears);
  const fits = (price: number) => {
    const costs = purchaseCosts(price, inputs.buyerType, inputs.replacementTaxEligible, inputs.fees, date, tax);
    const loan = Math.max(0, costs.total - inputs.equity);
    return loan <= price * regulation.maxLtv[inputs.buyerType] && loan <= incomeLimitedLoan;
  };
  let low = 0;
  let high = Math.min(100_000_000, inputs.equity + incomeLimitedLoan);
  for (let iteration = 0; iteration < 60; iteration++) {
    const mid = (low + high) / 2;
    if (fits(mid)) low = mid;
    else high = mid;
  }
  const maxPropertyPrice = Math.floor(low);
  return { ...purchase, maxPropertyPrice, incomeLimitedLoan };
}
