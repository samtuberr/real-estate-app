import { REGULATION, type Regulation } from '../regulation/config';
import { amortize, inRange, isFixed } from './math';
import {
  TRACK_TYPES,
  type PaymentRow,
  type Plan,
  type PlanId,
  type RateTable,
  type RepaymentMethod,
  type Track,
  type TrackType,
} from './types';

export const PLAN_MIXES: Record<PlanId, Partial<Record<TrackType, number>>> = {
  stable: { fixed_unlinked: 0.8, prime: 0.2 },
  balanced: { fixed_unlinked: 0.5, prime: 0.3, fixed_linked: 0.2 },
  flexible: { fixed_unlinked: 0.34, prime: 0.5, variable5_linked: 0.16 },
};

export function validateTracks(tracks: Track[], regulation: Regulation = REGULATION) {
  if (!tracks.length) throw new RangeError('Tracks required');
  let shares = 0;
  let fixed = 0;
  const totalAmount = tracks.reduce((sum, track) => sum + track.amount, 0);
  for (const track of tracks) {
    if (!TRACK_TYPES.includes(track.type)) throw new RangeError('Unknown track type');
    inRange(track.share, 0, 1);
    inRange(track.amount, 0);
    inRange(track.annualRate, 0, 1);
    inRange(track.termYears, regulation.minTermYears, regulation.maxTermYears);
    if (Math.abs(track.termYears * 12 - Math.round(track.termYears * 12)) > 1e-8)
      throw new RangeError('Whole months required');
    if (Math.abs(totalAmount * track.share - track.amount) > 0.01) throw new RangeError('Share does not match amount');
    shares += track.share;
    if (isFixed(track.type)) fixed += track.share;
  }
  if (Math.abs(shares - 1) > 1e-8) throw new RangeError('Shares must sum to one');
  if (fixed + 1e-8 < regulation.minFixedShare || 1 - fixed > regulation.maxVariableShare + 1e-8) {
    throw new RangeError('Variable share exceeds the limit');
  }
}

export function calculatePlan(
  id: PlanId,
  tracks: Track[],
  annualCpi = 0,
  method: RepaymentMethod = 'annuity',
  regulation: Regulation = REGULATION,
): Plan {
  validateTracks(tracks, regulation);
  const schedules = tracks.map((track) => amortize(track, annualCpi, method));
  const months = Math.max(...schedules.map((schedule) => schedule.length));
  const schedule: PaymentRow[] = Array.from({ length: months }, (_, i) => {
    const row = { month: i + 1, payment: 0, principal: 0, interest: 0, indexation: 0, balance: 0 };
    for (const trackSchedule of schedules) {
      const payment = trackSchedule[i];
      if (payment)
        for (const key of ['payment', 'principal', 'interest', 'indexation', 'balance'] as const)
          row[key] += payment[key];
    }
    return row;
  });
  return {
    id,
    tracks,
    schedule,
    loanAmount: tracks.reduce((sum, track) => sum + track.amount, 0),
    monthlyPayment: schedule[0].payment,
    peakPayment: Math.max(...schedule.map((row) => row.payment)),
    totalRepayment: schedule.reduce((sum, row) => sum + row.payment, 0),
    totalInterest: schedule.reduce((sum, row) => sum + row.interest, 0),
    totalIndexation: schedule.reduce((sum, row) => sum + row.indexation, 0),
  };
}

export function createPlan(
  id: PlanId,
  amount: number,
  termYears: number,
  rates: RateTable,
  annualCpi = 0,
  method: RepaymentMethod = 'annuity',
  fixedShare?: number,
): Plan {
  inRange(amount, 0);
  if (!Object.hasOwn(PLAN_MIXES, id)) throw new RangeError('Unknown plan');
  // An optional editor shifts only the fixed-unlinked share. Other tracks retain
  // their relative proportions, and the regulatory fixed minimum is preserved.
  const original = PLAN_MIXES[id];
  if (fixedShare !== undefined) inRange(fixedShare, REGULATION.minFixedShare, 1);
  const tracks = (Object.entries(original) as [TrackType, number][])
    .map(([type, share]): Track => {
      const adjusted =
        fixedShare === undefined
          ? share
          : type === 'fixed_unlinked'
            ? fixedShare
            : (share * (1 - fixedShare)) / (1 - original.fixed_unlinked!);
      return { type, share: adjusted, amount: amount * adjusted, annualRate: rates[type], termYears };
    })
    .filter((track) => track.share > 1e-10);
  return calculatePlan(id, tracks, annualCpi, method);
}

export function annualSchedule(schedule: PaymentRow[]) {
  const years: Array<{
    year: number;
    principal: number;
    interest: number;
    indexation: number;
    payment: number;
    balance: number;
  }> = [];
  for (const row of schedule) {
    const index = Math.floor((row.month - 1) / 12);
    const year = years[index] ?? { year: index + 1, principal: 0, interest: 0, indexation: 0, payment: 0, balance: 0 };
    year.principal += row.principal;
    year.interest += row.interest;
    year.indexation += row.indexation;
    year.payment += row.payment;
    year.balance = row.balance;
    years[index] = year;
  }
  return years;
}
