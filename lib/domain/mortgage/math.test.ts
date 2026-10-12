import { amortize, loanFromPayment, monthlyPayment } from './math';
import type { Track } from './types';

const track: Track = { type: 'fixed_unlinked', amount: 100_000, annualRate: 0.06, termYears: 30, share: 1 };
const sum = (rows: ReturnType<typeof amortize>, key: keyof Omit<ReturnType<typeof amortize>[number], 'month'>) =>
  rows.reduce((total, row) => total + row[key], 0);

describe('Spitzer and equal-principal calculations', () => {
  it('matches an independent standard annuity reference', () => {
    expect(monthlyPayment(100_000, 0.06, 30)).toBeCloseTo(599.55052515, 7);
  });
  it('handles zero and near-zero interest without cancellation', () => {
    expect(monthlyPayment(120_000, 0, 10)).toBe(1000);
    expect(monthlyPayment(120_000, 1e-12, 10)).toBeCloseTo(1000, 6);
  });
  it('inverts a payment into borrowing capacity', () => {
    expect(loanFromPayment(599.55052515, 0.06, 30)).toBeCloseTo(100_000, 3);
    expect(loanFromPayment(1000, 0, 10)).toBe(120_000);
  });
  it('fully repays the original principal, with constant unlinked payments', () => {
    const rows = amortize(track);
    expect(rows).toHaveLength(360);
    expect(rows.at(-1)?.balance).toBe(0);
    expect(sum(rows, 'principal')).toBeCloseTo(track.amount, 6);
    expect(sum(rows, 'payment')).toBeCloseTo(track.amount + sum(rows, 'interest'), 5);
    expect(rows.every((row) => row.balance >= 0 && Math.abs(row.payment - rows[0].payment) < 0.00001)).toBe(true);
  });
  it('uses flat principal and declining payments for equal-principal loans', () => {
    const rows = amortize(track, 0, 'equal_principal');
    expect(rows[0].principal).toBeCloseTo(100_000 / 360, 8);
    expect(rows[0].payment).toBeGreaterThan(rows[359].payment);
    expect(sum(rows, 'interest')).toBeLessThan(sum(amortize(track), 'interest'));
    expect(rows.at(-1)?.balance).toBe(0);
  });
  it.each(['annuity', 'equal_principal'] as const)('keeps CPI additions separate and conserves cash (%s)', (method) => {
    const rows = amortize({ ...track, type: 'fixed_linked' }, 0.03, method);
    expect(sum(rows, 'indexation')).toBeGreaterThan(0);
    expect(sum(rows, 'payment')).toBeCloseTo(track.amount + sum(rows, 'interest') + sum(rows, 'indexation'), 5);
    expect(sum(rows, 'principal')).toBeCloseTo(track.amount + sum(rows, 'indexation'), 5);
    expect(rows.at(-1)?.balance).toBe(0);
  });
  it('uses compound annual CPI, not annual CPI divided by twelve', () => {
    const rows = amortize({ ...track, type: 'fixed_linked' }, 0.03);
    expect(rows[11].payment / monthlyPayment(track.amount, track.annualRate, track.termYears)).toBeCloseTo(1.03, 10);
  });
  it('CPI never changes unlinked tracks, including Prime', () => {
    expect(amortize(track, 0.1)).toEqual(amortize(track, 0));
    expect(amortize({ ...track, type: 'prime' }, 0.1)).toEqual(amortize({ ...track, type: 'prime' }, 0));
  });
  it('zero CPI gives the same schedule as an unlinked track', () => {
    expect(amortize({ ...track, type: 'fixed_linked' }, 0)).toEqual(amortize(track, 0));
  });
  it('returns zero payments and balances for a zero loan', () => {
    expect(amortize({ ...track, amount: 0 }).every((row) => row.payment === 0 && row.balance === 0)).toBe(true);
  });
  it.each([
    [-1, 0.05, 25],
    [NaN, 0.05, 25],
    [Infinity, 0.05, 25],
    [100_000, -0.01, 25],
    [100_000, Infinity, 25],
    [100_000, 0.05, 0],
    [100_000, 0.05, 31],
    [100_000, 0.05, 4.01],
  ])('rejects invalid annuity inputs %s / %s / %s', (amount, rate, years) => {
    expect(() => monthlyPayment(amount, rate, years)).toThrow(RangeError);
  });
  it('rejects invalid CPI assumptions', () => {
    for (const cpi of [-1, NaN, Infinity, 0.21]) expect(() => amortize(track, cpi)).toThrow(RangeError);
  });
});
