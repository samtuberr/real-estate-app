import { TAX_2026 } from './brackets';
import { purchaseCosts, purchaseTax, taxConfigCoversDate } from './purchase';

const date = '2026-10-12';
describe('2026 purchase tax', () => {
  it.each([
    [0, 0],
    [1_978_745, 0],
    [1_978_845, 3.5],
    [2_347_040, 12_890.33],
    [2_400_000, 15_538.33],
  ])('taxes only the marginal amount at price %s', (price, expected) => {
    expect(purchaseTax(price, 'first_home', false, date)).toBe(expected);
  });
  it('applies upper marginal brackets without taxing the whole price at the top rate', () => {
    expect(
      purchaseTax(6_055_170, 'first_home', false, date) - purchaseTax(6_055_070, 'first_home', false, date),
    ).toBeCloseTo(8, 2);
    expect(
      purchaseTax(20_183_665, 'first_home', false, date) - purchaseTax(20_183_565, 'first_home', false, date),
    ).toBeCloseTo(10, 2);
  });
  it('uses additional-home brackets and crosses the 10% boundary', () => {
    expect(purchaseTax(2_400_000, 'investor', true, date)).toBe(192_000);
    expect(purchaseTax(6_055_170, 'investor', false, date)).toBeCloseTo(6_055_070 * 0.08 + 10, 2);
  });
  it('does not silently assume replacement-home tax eligibility', () => {
    expect(purchaseTax(2_400_000, 'upgrader', false, date)).toBe(192_000);
    expect(purchaseTax(2_400_000, 'upgrader', true, date)).toBe(15_538.33);
  });
  it.each(['2025-12-31', '2027-01-01', '2026-02-30', 'bad-date'])(
    'fails closed outside a valid date (%s)',
    (invalidDate) => {
      expect(taxConfigCoversDate(TAX_2026, invalidDate)).toBe(false);
      expect(() => purchaseTax(1_000_000, 'first_home', false, invalidDate)).toThrow();
    },
  );
  it('includes every fee once, with percentages inclusive of VAT', () => {
    const costs = purchaseCosts(
      2_400_000,
      'first_home',
      false,
      { lawyerRate: 0.0059, agentRate: 0.0236, appraiser: 2500, advisor: 8000, moving: 5000, renovation: 40_000 },
      date,
    );
    expect(costs.items.lawyer).toBe(14_160);
    expect(costs.items.agent).toBe(56_640);
    expect(costs.total).toBeCloseTo(2_541_838.33, 2);
    expect(() =>
      purchaseCosts(
        2_400_000,
        'first_home',
        false,
        { lawyerRate: -0.1, agentRate: 0, appraiser: 0, advisor: 0, moving: 0, renovation: 0 },
        date,
      ),
    ).toThrow();
  });
});
