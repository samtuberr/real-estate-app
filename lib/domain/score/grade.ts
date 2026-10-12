import type { ScoreGrade } from '../types';

/** Grade thresholds from spec §5.2: ≥80, 65–79, 50–64, <50. */
export function scoreGrade(total: number): ScoreGrade {
  if (total >= 80) return 'excellent';
  if (total >= 65) return 'good';
  if (total >= 50) return 'fair';
  return 'low';
}

export type ScoreBand = 'high' | 'mid' | 'low';

/** Color band for markers, badges and rings (`score-high|mid|low` tokens). */
export function scoreBand(total: number): ScoreBand {
  if (total >= 65) return 'high';
  if (total >= 50) return 'mid';
  return 'low';
}
