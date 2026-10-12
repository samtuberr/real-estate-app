import type { PaymentRow, RepaymentMethod, Track } from './types';

export function inRange(value: number, min: number, max = Number.MAX_SAFE_INTEGER): number {
  if (!Number.isFinite(value) || value < min || value > max) throw new RangeError('Invalid mortgage input');
  return value;
}

function periods(termYears: number) {
  inRange(termYears, 1 / 12, 30);
  const months = Math.round(termYears * 12);
  if (Math.abs(months - termYears * 12) > 1e-8) throw new RangeError('Term must be whole months');
  return months;
}

/** Stable at zero and near-zero rates; no monthly rounding drift. */
export function monthlyPayment(amount: number, annualRate: number, termYears: number): number {
  inRange(amount, 0);
  inRange(annualRate, 0, 1);
  const months = periods(termYears);
  if (annualRate === 0) return amount / months;
  const rate = annualRate / 12;
  return (amount * rate) / -Math.expm1(-months * Math.log1p(rate));
}

export function loanFromPayment(payment: number, annualRate: number, termYears: number): number {
  inRange(payment, 0);
  return payment / monthlyPayment(1, annualRate, termYears);
}

export function isLinked(type: Track['type']) {
  return type === 'fixed_linked' || type === 'variable5_linked';
}

export function isFixed(type: Track['type']) {
  return type === 'fixed_linked' || type === 'fixed_unlinked';
}

/**
 * Constant rate/CPI scenario, not a forecast. Index the opening balance before
 * interest and scale the contractual payment by the cumulative monthly index.
 * CPI capital additions are kept separate from interest. Bank-specific index
 * floors, reset curves, insurance, fees and early repayment are not modeled.
 */
export function amortize(track: Track, annualCpi = 0, method: RepaymentMethod = 'annuity'): PaymentRow[] {
  const basePayment = monthlyPayment(track.amount, track.annualRate, track.termYears);
  inRange(annualCpi, 0, 0.2);
  if (method !== 'annuity' && method !== 'equal_principal') throw new RangeError('Unknown repayment method');
  const months = periods(track.termYears);
  const monthlyIndex = isLinked(track.type) ? Math.pow(1 + annualCpi, 1 / 12) : 1;
  let balance = track.amount;
  return Array.from({ length: months }, (_, i) => {
    const month = i + 1;
    const indexation = balance * (monthlyIndex - 1);
    const indexedBalance = balance + indexation;
    const interest = (indexedBalance * track.annualRate) / 12;
    const index = Math.pow(monthlyIndex, month);
    const scheduledPrincipal = method === 'annuity' ? basePayment * index - interest : (track.amount / months) * index;
    const principal = month === months ? indexedBalance : Math.min(indexedBalance, Math.max(0, scheduledPrincipal));
    balance = Math.max(0, indexedBalance - principal);
    return { month, payment: principal + interest, principal, interest, indexation, balance };
  });
}
