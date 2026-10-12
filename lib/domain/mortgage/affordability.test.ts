import { REGULATION } from '../regulation/config';
import { purchaseCosts } from '../tax/purchase';
import { assessPurchase, deriveAffordability } from './affordability';
import { monthlyPayment } from './math';
import type { PlanningInputs } from './types';

const date = '2026-10-12';
const inputs: PlanningInputs = {
  price: 2_400_000,
  equity: 800_000,
  monthlyIncome: 30_000,
  monthlyObligations: 2000,
  buyerType: 'first_home',
  replacementTaxEligible: false,
  termYears: 25,
  annualCpi: 0.02,
  fees: { lawyerRate: 0.0059, agentRate: 0, appraiser: 2500, advisor: 8000, moving: 5000, renovation: 40_000 },
};

describe('affordability with cash-funded purchase costs', () => {
  it('reserves closing costs before allocating cash to the price', () => {
    const result = assessPurchase(inputs, date);
    expect(result.loanNeeded).toBeCloseTo(1_685_198.33, 2);
    expect(result.requiredEquity).toBeCloseTo(685_198.33, 2);
    expect(result.disposableIncome).toBe(28_000);
    expect(result.recommendedPayment).toBe(9240);
  });
  it.each([
    ['first_home', 0.75],
    ['upgrader', 0.7],
    ['investor', 0.5],
  ] as const)('uses %s LTV without concealing equity shortfall', (buyerType, ltv) => {
    const result = assessPurchase({ ...inputs, buyerType, equity: 50_000 }, date);
    expect(result.maxLoan).toBe(inputs.price * ltv);
    expect(result.equityGap).toBeGreaterThan(0);
    expect(result.loanNeeded).toBeGreaterThan(result.maxLoan);
  });
  it('does not borrow closing costs when cash does not cover them', () => {
    const result = assessPurchase({ ...inputs, equity: 0 }, date);
    expect(result.loanNeeded).toBe(inputs.price);
    expect(result.equityGap).toBe(result.requiredEquity);
  });
  it('max price satisfies both equity and monthly payment constraints', () => {
    for (const buyerType of ['first_home', 'upgrader', 'investor'] as const) {
      const result = deriveAffordability({ ...inputs, buyerType }, 0.05, date);
      const costs = purchaseCosts(result.maxPropertyPrice, buyerType, false, inputs.fees, date);
      const loan = Math.max(0, costs.total - inputs.equity);
      expect(loan).toBeLessThanOrEqual(result.maxPropertyPrice * REGULATION.maxLtv[buyerType]);
      expect(monthlyPayment(loan, 0.05, inputs.termYears)).toBeLessThanOrEqual(result.recommendedPayment + 0.01);
    }
  });
  it('zero cash means no purchase budget, even with high income', () => {
    expect(deriveAffordability({ ...inputs, equity: 0 }, 0.05, date).maxPropertyPrice).toBe(0);
  });
  it('zero disposable income permits cash-only purchases', () => {
    const result = deriveAffordability({ ...inputs, monthlyIncome: 1000, monthlyObligations: 2000 }, 0.05, date);
    expect(result.incomeLimitedLoan).toBe(0);
    expect(result.maxPropertyPrice).toBeGreaterThan(0);
    expect(result.maxPropertyPrice).toBeLessThan(inputs.equity);
  });
  it('more fees, higher rates and less income never increase the budget', () => {
    const budget = deriveAffordability(inputs, 0.05, date).maxPropertyPrice;
    expect(
      deriveAffordability({ ...inputs, fees: { ...inputs.fees, agentRate: 0.0236 } }, 0.05, date).maxPropertyPrice,
    ).toBeLessThan(budget);
    expect(deriveAffordability(inputs, 0.08, date).maxPropertyPrice).toBeLessThan(budget);
    expect(deriveAffordability({ ...inputs, monthlyIncome: 15_000 }, 0.05, date).maxPropertyPrice).toBeLessThan(budget);
  });
  it('supports a debt-free purchase', () => {
    expect(assessPurchase({ ...inputs, equity: 3_000_000 }, date).loanNeeded).toBe(0);
  });
  it('rejects invalid inputs and unsupported dates', () => {
    expect(() => assessPurchase({ ...inputs, equity: NaN }, date)).toThrow();
    expect(() => deriveAffordability(inputs, 0.05, '2027-01-01')).toThrow();
  });
});
