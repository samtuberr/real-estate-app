import type { ScoreGrade } from '../types';
import { DEFAULT_SCORE_CONFIG, type ScoreConfig } from './config';

/** Grade thresholds from spec §5.2: ≥80, 65–79, 50–64, <50. */
export function scoreGrade(total: number, thresholds: ScoreConfig['grades'] = DEFAULT_SCORE_CONFIG.grades): ScoreGrade {
  if (total >= thresholds.excellent) return 'excellent';
  if (total >= thresholds.good) return 'good';
  if (total >= thresholds.fair) return 'fair';
  return 'low';
}

export type ScoreBand = 'high' | 'mid' | 'low';

/** Color band for markers, badges and rings (`score-high|mid|low` tokens). */
export function scoreBand(total: number): ScoreBand {
  if (total >= 65) return 'high';
  if (total >= 50) return 'mid';
  return 'low';
}
