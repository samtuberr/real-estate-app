import { REGULATION } from '../regulation/config';
import { annualSchedule, calculatePlan, createPlan, validateTracks } from './plans';
import { PLAN_IDS, type RateTable, type Track } from './types';

const rates: RateTable = {
  fixed_unlinked: 0.05,
  prime: 0.0475,
  fixed_linked: 0.0325,
  variable5_unlinked: 0.045,
  variable5_linked: 0.03,
};
describe('mortgage plans', () => {
  it.each(PLAN_IDS)('%s follows mix limits and reconciles totals', (id) => {
    const plan = createPlan(id, 1_000_000, 25, rates, 0.02);
    expect(() => validateTracks(plan.tracks)).not.toThrow();
    expect(plan.tracks.reduce((sum, track) => sum + track.amount, 0)).toBeCloseTo(1_000_000, 6);
    expect(plan.totalRepayment).toBeCloseTo(plan.loanAmount + plan.totalInterest + plan.totalIndexation, 5);
    expect(plan.schedule.at(-1)?.balance).toBe(0);
  });
  it('honors rates and independently edited track terms', () => {
    const tracks: Track[] = [
      { type: 'fixed_unlinked', share: 0.5, amount: 120_000, annualRate: 0, termYears: 10 },
      { type: 'prime', share: 0.5, amount: 120_000, annualRate: 0, termYears: 20 },
    ];
    const plan = calculatePlan('balanced', tracks);
    expect(plan.schedule[0].payment).toBe(1500);
    expect(plan.schedule[120].payment).toBe(500);
    expect(plan.totalRepayment).toBeCloseTo(240_000, 5);
  });
  it('rejects invalid mix and mismatched amounts', () => {
    const tracks = createPlan('stable', 100_000, 25, rates).tracks;
    expect(() => validateTracks(tracks.map((track) => ({ ...track, share: 0.6 })))).toThrow();
    expect(() => validateTracks([{ ...tracks[0], amount: 50_000 }, tracks[1]])).toThrow();
    expect(() => calculatePlan('flexible', [{ ...tracks[1], share: 1, amount: 100_000 }])).toThrow();
    expect(() => calculatePlan('stable', [{ ...tracks[0], termYears: 31, share: 1 }])).toThrow();
  });
  it('checks the precise variable limit with injected regulation', () => {
    const tracks = createPlan('stable', 100_000, 25, rates).tracks;
    expect(() => validateTracks(tracks, { ...REGULATION, minFixedShare: 0.9, maxVariableShare: 0.1 })).toThrow();
    expect(() => createPlan('flexible', 100_000, 25, rates, 0, 'annuity', 1 / 3)).toThrow();
  });
  it('reallocates other tracks proportionally and permits fully fixed loans', () => {
    const plan = createPlan('flexible', 1_000_000, 25, rates, 0.02, 'annuity', 0.5);
    expect(plan.tracks[0].share).toBe(0.5);
    expect(plan.tracks[1].share / plan.tracks[2].share).toBeCloseTo(0.5 / 0.16, 8);
    const fixed = createPlan('balanced', 1_000_000, 25, rates, 0.05, 'annuity', 1);
    expect(fixed.tracks).toHaveLength(1);
    expect(fixed.totalIndexation).toBe(0);
  });
  it('annual data conserves payments and exposes the final balance', () => {
    const plan = createPlan('balanced', 1_000_000, 25, rates, 0.02);
    const years = annualSchedule(plan.schedule);
    expect(years).toHaveLength(25);
    expect(years.reduce((sum, row) => sum + row.payment, 0)).toBeCloseTo(plan.totalRepayment, 5);
    expect(years.at(-1)?.balance).toBe(0);
  });
  it('has no hidden clock or mutable shared configuration', () => {
    expect(createPlan('balanced', 1_000_000, 25, rates, 0.02)).toEqual(
      createPlan('balanced', 1_000_000, 25, rates, 0.02),
    );
  });
});
