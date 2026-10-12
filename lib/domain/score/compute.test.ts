import { AMENITY_CATEGORIES, type CityPlan } from '../types';
import { computeScore, type ScoreInputs } from './compute';
import { DEFAULT_SCORE_CONFIG } from './config';

const empty: ScoreInputs = { computedAt: '2026-10-12T00:00:00.000Z' };
const full: ScoreInputs = {
  ...empty,
  plans: [],
  renewalEligible: false,
  amenities: AMENITY_CATEGORIES.map((category) => ({
    category,
    count: 3,
    nearest: { name: { en: 'Demo', he: 'הדגמה' }, distanceMeters: 200 },
  })),
  traffic: {
    congestion: 'low',
    noise: 'low',
    highwayDistanceMeters: 1000,
    stops: [{ kind: 'bus', name: { en: 'Bus', he: 'אוטובוס' }, distanceMeters: 200 }],
  },
  market: { neighborhoodMedianPricePerSqm: 30000, fiveYearChange: 0.1 },
  comparableCount: 5,
  property: {
    price: 3000000,
    sizeSqm: 100,
    buildingYear: 2020,
    floor: 3,
    features: { elevator: true, parking: 1, mamad: true, balcony: true, storage: true },
  },
};
const sub = (inputs: ScoreInputs, key: string) => computeScore(inputs)!.subScores.find((s) => s.key === key)!.value;
const plan: CityPlan = {
  id: 'a',
  planNumber: 'DEMO',
  name: { en: 'Demo', he: 'הדגמה' },
  impact: { en: 'Demo', he: 'הדגמה' },
  status: 'approved',
  type: 'transit',
  distanceMeters: 200,
  geometry: { type: 'Polygon', coordinates: [] },
};

it('is deterministic, bounded and uses the specified weighted sum', () => {
  const score = computeScore(full)!;
  expect(score).toEqual(computeScore(full));
  expect(score.confidence).toBe('high');
  expect(score.total).toBe(Math.round(score.subScores.reduce((sum, s) => sum + s.weight * s.value, 0)));
  expect(score.subScores.map((s) => s.weight)).toEqual([0.3, 0.2, 0.15, 0.25, 0.1]);
  for (const s of score.subScores) {
    expect(s.value).toBeGreaterThanOrEqual(0);
    expect(s.value).toBeLessThanOrEqual(100);
    expect(s.highlights.every((h) => h.en && h.he)).toBe(true);
  }
  expect(score.algorithmVersion).toBe(DEFAULT_SCORE_CONFIG.version);
  expect(score.computedAt).toBe(empty.computedAt);
});

it('redistributes missing weights and reduces confidence', () => {
  const score = computeScore({ ...full, traffic: undefined })!;
  expect(score.confidence).toBe('medium');
  expect(score.subScores.find((s) => s.key === 'traffic')).toBeUndefined();
  expect(score.subScores.find((s) => s.key === 'plans')!.weight).toBeCloseTo(0.3 / 0.85);
  expect(score.subScores.reduce((sum, s) => sum + s.weight, 0)).toBeCloseTo(1);
  expect(computeScore({ ...empty, plans: [] })!.confidence).toBe('low');
  expect(computeScore(empty)).toBeUndefined();
});

it('distinguishes a completed empty survey from unavailable inputs', () => {
  expect(computeScore({ ...empty, plans: [] })!.subScores[0].value).toBe(20);
  expect(computeScore({ ...empty, amenities: [] })).toBeUndefined();
  const amenities = AMENITY_CATEGORIES.map((category) => ({ category, count: 0 }));
  expect(sub({ ...empty, amenities }, 'amenities')).toBe(0);
});

it('rewards approval and proximity without treating planned transit as operational', () => {
  expect(sub({ ...full, plans: [plan] }, 'plans')).toBeGreaterThan(
    sub({ ...full, plans: [{ ...plan, status: 'proposed' }] }, 'plans'),
  );
  expect(sub({ ...full, plans: [plan] }, 'plans')).toBeGreaterThan(
    sub({ ...full, plans: [{ ...plan, distanceMeters: 700 }] }, 'plans'),
  );
  expect(sub({ ...full, plans: [{ ...plan, distanceMeters: 801 }] }, 'plans')).toBe(sub(full, 'plans'));
  expect(sub({ ...full, plans: [plan] }, 'traffic')).toBe(sub(full, 'traffic'));
});

it('penalizes congestion, noise, high relative prices and inaccessible floors', () => {
  expect(sub({ ...full, traffic: { ...full.traffic!, congestion: 'heavy', noise: 'high' } }, 'traffic')).toBeLessThan(
    sub(full, 'traffic'),
  );
  expect(sub({ ...full, property: { ...full.property!, price: 4000000 } }, 'market')).toBeLessThan(sub(full, 'market'));
  expect(
    sub(
      { ...full, property: { ...full.property!, features: { ...full.property!.features, elevator: false } } },
      'property',
    ),
  ).toBeLessThan(sub(full, 'property'));
});

it.each([NaN, Infinity, -1, 0])('omits invalid market observations (%s), never emits NaN', (sizeSqm) => {
  const score = computeScore({ ...full, property: { ...full.property!, sizeSqm } })!;
  expect(score.subScores.some((s) => s.key === 'market')).toBe(false);
  expect(Number.isFinite(score.total)).toBe(true);
});

it('requires enough comparable deals and complete amenity coverage', () => {
  expect(computeScore({ ...full, comparableCount: 2 })!.subScores.some((s) => s.key === 'market')).toBe(false);
  expect(
    computeScore({ ...full, amenities: full.amenities!.slice(1) })!.subScores.some((s) => s.key === 'amenities'),
  ).toBe(false);
});

it('takes weights and grade thresholds from the supplied server configuration', () => {
  const score = computeScore(full, {
    ...DEFAULT_SCORE_CONFIG,
    version: 'custom',
    weights: { plans: 1, amenities: 0, traffic: 0, market: 0, property: 0 },
    grades: { excellent: 20, good: 15, fair: 10 },
  })!;
  expect(score.total).toBe(20);
  expect(score.grade).toBe('excellent');
  expect(score.algorithmVersion).toBe('custom');
});

it('rejects invalid configuration and computation dates', () => {
  expect(() =>
    computeScore(full, { ...DEFAULT_SCORE_CONFIG, weights: { ...DEFAULT_SCORE_CONFIG.weights, plans: NaN } }),
  ).toThrow();
  expect(() =>
    computeScore(full, { ...DEFAULT_SCORE_CONFIG, amenities: { ...DEFAULT_SCORE_CONFIG.amenities, radiusMeters: 0 } }),
  ).toThrow();
  expect(() => computeScore({ ...full, computedAt: 'invalid' })).toThrow();
});
