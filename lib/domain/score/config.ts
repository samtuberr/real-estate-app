import type { SubScoreKey } from '../types';

/** Initial, uncalibrated model. B3 stores this versioned object in score_config. */
export const DEFAULT_SCORE_CONFIG = {
  version: '1.0.0-preview',
  weights: { plans: 0.3, amenities: 0.2, traffic: 0.15, market: 0.25, property: 0.1 } as Record<SubScoreKey, number>,
  grades: { excellent: 80, good: 65, fair: 50 },
  confidence: { high: 1, medium: 0.6 },
  plans: {
    radiusMeters: 1000,
    transitRadiusMeters: 800,
    baseline: 20,
    renewalBonus: 20,
    distanceDiscount: 0.5,
    statusPoints: { proposed: 25, deposited: 45, approved: 65, in_execution: 80 },
  },
  amenities: { radiusMeters: 800, targetCount: 3, countShare: 0.5 },
  traffic: {
    transitRadiusMeters: 1200,
    highwayRadiusMeters: 5000,
    transitPoints: 45,
    highwayPoints: 15,
    congestionPoints: { low: 25, moderate: 12, heavy: 0 },
    noisePoints: { low: 15, moderate: 7, high: 0 },
  },
  market: { priceRatioLow: 0.8, priceRatioHigh: 1.2, trendLow: -0.2, trendHigh: 0.4, valueShare: 0.6, minDeals: 3 },
  property: {
    baseline: 20,
    elevatorPoints: 15,
    parkingPoints: 15,
    mamadPoints: 20,
    balconyPoints: 10,
    storagePoints: 5,
    agePoints: 15,
    ageHorizonYears: 80,
    walkUpFloor: 2,
    walkUpPenalty: 15,
    renewalAgeYears: 40,
    renewalBonus: 10,
  },
};

export type ScoreConfig = typeof DEFAULT_SCORE_CONFIG;
export const SUB_SCORE_KEYS: SubScoreKey[] = ['plans', 'amenities', 'traffic', 'market', 'property'];

export function validateScoreConfig(config: ScoreConfig) {
  const finite = (value: unknown): boolean =>
    typeof value === 'number'
      ? Number.isFinite(value)
      : typeof value === 'object' && value !== null
        ? Object.values(value).every(finite)
        : typeof value === 'string';
  const positive = [
    config.plans.radiusMeters,
    config.plans.transitRadiusMeters,
    config.amenities.radiusMeters,
    config.amenities.targetCount,
    config.traffic.transitRadiusMeters,
    config.traffic.highwayRadiusMeters,
    config.property.ageHorizonYears,
    config.market.minDeals,
  ];
  if (
    !finite(config) ||
    !config.version.trim() ||
    positive.some((v) => v <= 0) ||
    SUB_SCORE_KEYS.some(
      (key) => !Number.isFinite(config.weights[key]) || config.weights[key] < 0 || config.weights[key] > 1,
    ) ||
    SUB_SCORE_KEYS.reduce((sum, key) => sum + config.weights[key], 0) <= 0 ||
    config.market.priceRatioHigh <= config.market.priceRatioLow ||
    config.market.trendHigh <= config.market.trendLow ||
    [
      config.plans.distanceDiscount,
      config.amenities.countShare,
      config.market.valueShare,
      config.confidence.high,
      config.confidence.medium,
    ].some((v) => v < 0 || v > 1) ||
    config.confidence.medium > config.confidence.high ||
    !(
      100 >= config.grades.excellent &&
      config.grades.excellent > config.grades.good &&
      config.grades.good > config.grades.fair &&
      config.grades.fair >= 0
    )
  ) {
    throw new Error('Invalid score configuration');
  }
}
