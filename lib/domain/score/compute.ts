import {
  AMENITY_CATEGORIES,
  type LocalizedText,
  type MarketStats,
  type PotentialScore,
  type Property,
  type PropertyContext,
  type SubScoreKey,
} from '../types';
import { DEFAULT_SCORE_CONFIG, SUB_SCORE_KEYS, validateScoreConfig, type ScoreConfig } from './config';
import { scoreGrade } from './grade';

export type ScoreInputs = PropertyContext & {
  property?: Pick<Property, 'price' | 'sizeSqm' | 'buildingYear' | 'floor' | 'features'>;
  market?: MarketStats;
  comparableCount?: number;
  /** Injected by the caller, never read from the clock inside the engine. */
  computedAt: string;
};

const unit = (v: number) => Math.max(0, Math.min(1, v));
const valid = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const reason = (en: string, he: string): LocalizedText => ({ en, he });
type Result = { value: number; highlights: LocalizedText[] };

/** Pure, deterministic calculation shared by the mock API, app previews and B3 worker. */
export function computeScore(
  inputs: ScoreInputs,
  config: ScoreConfig = DEFAULT_SCORE_CONFIG,
): PotentialScore | undefined {
  validateScoreConfig(config);
  if (!Number.isFinite(Date.parse(inputs.computedAt))) throw new Error('Invalid score computation date');
  const results: Partial<Record<SubScoreKey, Result>> = {};
  const { plans, amenities, traffic, market, property } = inputs;

  if (plans && plans.every((p) => valid(p.distanceMeters) && Object.prototype.hasOwnProperty.call(config.plans.statusPoints, p.status))) {
    const nearby = plans.filter(
      (p) => p.distanceMeters <= (p.type === 'transit' ? config.plans.transitRadiusMeters : config.plans.radiusMeters),
    );
    const strongest = Math.max(
      0,
      ...nearby.map(
        (p) =>
          config.plans.statusPoints[p.status] *
          (1 -
            config.plans.distanceDiscount *
              unit(
                p.distanceMeters /
                  (p.type === 'transit' ? config.plans.transitRadiusMeters : config.plans.radiusMeters),
              )),
      ),
    );
    results.plans = {
      value: config.plans.baseline + strongest + (inputs.renewalEligible === true ? config.plans.renewalBonus : 0),
      highlights: [
        reason(
          `${nearby.length} plans within the scoring radius. Approved plans carry more weight than proposals.`,
          `${nearby.length} תוכניות בטווח החישוב. לתוכניות מאושרות משקל גבוה יותר מהצעות.`,
        ),
        reason(
          inputs.renewalEligible === true
            ? 'Building renewal eligibility is recorded.'
            : 'No confirmed building renewal eligibility contributes to this score.',
          inputs.renewalEligible === true
            ? 'נרשמה זכאות הבניין להתחדשות.'
            : 'אין זכאות מאומתת להתחדשות שתורמת לציון זה.',
        ),
      ],
    };
  }

  // Require a complete survey: omitted categories must not masquerade as zero counts.
  if (
    amenities &&
    AMENITY_CATEGORIES.every((key) => amenities.filter((g) => g.category === key).length === 1) &&
    amenities.every(
      (g) =>
        Number.isInteger(g.count) &&
        g.count >= 0 &&
        (g.count === 0 ||
          (g.nearest && valid(g.nearest.distanceMeters) && g.nearest.distanceMeters <= config.amenities.radiusMeters)),
    )
  ) {
    const groups = AMENITY_CATEGORIES.map((key) => amenities.find((g) => g.category === key)!);
    results.amenities = {
      value:
        (100 *
          groups.reduce(
            (sum, g) =>
              sum +
              (g.count === 0
                ? 0
                : config.amenities.countShare * unit(g.count / config.amenities.targetCount) +
                  (1 - config.amenities.countShare) *
                    (1 - unit(g.nearest!.distanceMeters / config.amenities.radiusMeters))),
            0,
          )) /
        groups.length,
      highlights: [
        reason(
          `${groups.reduce((sum, g) => sum + g.count, 0)} amenities across ${groups.filter((g) => g.count > 0).length} categories within ${config.amenities.radiusMeters}m. More variety and shorter distances raise this score.`,
          `${groups.reduce((sum, g) => sum + g.count, 0)} שירותים ב־${groups.filter((g) => g.count > 0).length} קטגוריות בטווח ${config.amenities.radiusMeters} מ׳. מגוון ומרחקים קצרים מעלים את הציון.`,
        ),
      ],
    };
  }

  if (
    traffic &&
    valid(traffic.highwayDistanceMeters) &&
    Object.prototype.hasOwnProperty.call(config.traffic.congestionPoints, traffic.congestion) &&
    Object.prototype.hasOwnProperty.call(config.traffic.noisePoints, traffic.noise) &&
    traffic.stops.every((s) => valid(s.distanceMeters))
  ) {
    const nearest = Math.min(Infinity, ...traffic.stops.map((s) => s.distanceMeters));
    const congestionHe = { low: 'נמוך', moderate: 'בינוני', heavy: 'כבד' };
    const noiseHe = { low: 'נמוך', moderate: 'בינוני', high: 'גבוה' };
    results.traffic = {
      value:
        config.traffic.transitPoints * (1 - unit(nearest / config.traffic.transitRadiusMeters)) +
        config.traffic.highwayPoints * (1 - unit(traffic.highwayDistanceMeters / config.traffic.highwayRadiusMeters)) +
        config.traffic.congestionPoints[traffic.congestion] +
        config.traffic.noisePoints[traffic.noise],
      highlights: [
        Number.isFinite(nearest)
          ? reason(
              `Nearest public transport stop: ${nearest}m. Shorter distances improve access.`,
              `תחנת התחבורה הציבורית הקרובה: ${nearest} מ׳. מרחק קצר משפר את הנגישות.`,
            )
          : reason('No public transport stops recorded in this survey.', 'לא נרשמו תחנות תחבורה ציבורית בסקר זה.'),
        reason(
          `Peak congestion: ${traffic.congestion}; road noise: ${traffic.noise}. Congestion and noise reduce this score.`,
          `עומס בשעות השיא: ${congestionHe[traffic.congestion]}; רעש כביש: ${noiseHe[traffic.noise]}. עומס ורעש מורידים את הציון.`,
        ),
      ],
    };
  }

  if (
    market &&
    property &&
    valid(property.price) &&
    property.price > 0 &&
    valid(property.sizeSqm) &&
    property.sizeSqm > 0 &&
    valid(market.neighborhoodMedianPricePerSqm) &&
    market.neighborhoodMedianPricePerSqm > 0 &&
    Number.isFinite(market.fiveYearChange) &&
    market.fiveYearChange > -1 &&
    valid(inputs.comparableCount) &&
    inputs.comparableCount >= config.market.minDeals
  ) {
    const ratio = property.price / property.sizeSqm / market.neighborhoodMedianPricePerSqm;
    const diff = Math.round((ratio - 1) * 100);
    const trend = Math.round(market.fiveYearChange * 100);
    results.market = {
      value:
        100 *
        (config.market.valueShare *
          unit((config.market.priceRatioHigh - ratio) / (config.market.priceRatioHigh - config.market.priceRatioLow)) +
          (1 - config.market.valueShare) *
            unit(
              (market.fiveYearChange - config.market.trendLow) / (config.market.trendHigh - config.market.trendLow),
            )),
      highlights: [
        reason(
          `Price per sqm is ${Math.abs(diff)}% ${diff < 0 ? 'below' : 'above'} the neighborhood median (${inputs.comparableCount} comparable deals). A lower relative price raises this score.`,
          `המחיר למ״ר ${Math.abs(diff)}% ${diff < 0 ? 'מתחת' : 'מעל'} לחציון בשכונה (${inputs.comparableCount} עסקאות להשוואה). מחיר יחסי נמוך מעלה את הציון.`,
        ),
        reason(
          `Five-year price change: ${trend > 0 ? '+' : ''}${trend}%. Past growth is not a forecast.`,
          `שינוי המחיר בחמש שנים: ${trend > 0 ? '+' : ''}${trend}%. צמיחה בעבר אינה תחזית.`,
        ),
      ],
    };
  }

  if (
    property &&
    valid(property.buildingYear) &&
    property.buildingYear >= 1800 &&
    property.buildingYear <= new Date(inputs.computedAt).getUTCFullYear() + 10 &&
    valid(property.floor) &&
    valid(property.features.parking) &&
    ['elevator', 'mamad', 'balcony', 'storage'].every(
      (key) => typeof property.features[key as keyof typeof property.features] === 'boolean',
    )
  ) {
    const p = config.property;
    const age = Math.max(0, new Date(inputs.computedAt).getUTCFullYear() - property.buildingYear);
    const f = property.features;
    const walkUp = property.floor > p.walkUpFloor && !f.elevator;
    results.property = {
      value:
        p.baseline +
        (f.elevator ? p.elevatorPoints : 0) +
        (f.parking > 0 ? p.parkingPoints : 0) +
        (f.mamad ? p.mamadPoints : 0) +
        (f.balcony ? p.balconyPoints : 0) +
        (f.storage ? p.storagePoints : 0) +
        p.agePoints * (1 - unit(age / p.ageHorizonYears)) -
        (walkUp ? p.walkUpPenalty : 0) +
        (age >= p.renewalAgeYears && inputs.renewalEligible === true ? p.renewalBonus : 0),
      highlights: [
        reason(
          `Built ${property.buildingYear}. Parking: ${f.parking}. Safe room: ${f.mamad ? 'yes' : 'no'}. Newer buildings and value-holding features raise this score.`,
          `שנת בנייה: ${property.buildingYear}. חניות: ${f.parking}. ממ״ד: ${f.mamad ? 'כן' : 'לא'}. בניינים חדשים ומאפיינים ששומרים על ערך מעלים את הציון.`,
        ),
        reason(
          walkUp ? 'Upper floor without an elevator reduces accessibility.' : 'No upper-floor walk-up penalty.',
          walkUp ? 'קומה גבוהה ללא מעלית מפחיתה נגישות.' : 'אין הפחתה בגין קומה גבוהה ללא מעלית.',
        ),
      ],
    };
  }

  const available = SUB_SCORE_KEYS.filter((key) => results[key] && config.weights[key] > 0);
  const weight = available.reduce((sum, key) => sum + config.weights[key], 0);
  if (weight === 0) return undefined;
  const coverage = weight / SUB_SCORE_KEYS.reduce((sum, key) => sum + config.weights[key], 0);
  const subScores = available.map((key) => ({
    key,
    value: Math.round(Math.max(0, Math.min(100, results[key]!.value))),
    weight: config.weights[key] / weight,
    highlights: results[key]!.highlights,
  }));
  const total = Math.round(subScores.reduce((sum, s) => sum + s.value * s.weight, 0));
  return {
    total,
    grade: scoreGrade(total, config.grades),
    confidence: coverage >= config.confidence.high ? 'high' : coverage >= config.confidence.medium ? 'medium' : 'low',
    subScores,
    algorithmVersion: config.version,
    computedAt: inputs.computedAt,
  };
}
