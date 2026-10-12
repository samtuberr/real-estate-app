import { EMPTY_FILTERS } from '@/lib/domain/filters';
import type { Bbox } from '@/lib/domain/types';
import { DEFAULT_REGION, inBbox, regionToBbox } from '@/lib/map/region';

import { mockData } from './mock/data';
import { computeScore } from '@/lib/domain/score/compute';
import { getPropertiesByIds, getPropertiesInBbox, getProperty, searchPlaces } from './properties';

const ISRAEL: Bbox = [34.2, 29.4, 35.9, 33.4];

describe('mock dataset', () => {
  it('is deterministic and shaped like the API', () => {
    const { properties } = mockData();
    expect(properties.length).toBeGreaterThan(100);
    expect(new Set(properties.map((p) => p.id)).size).toBe(properties.length);
    for (const p of properties) {
      expect(inBbox(p.location, ISRAEL)).toBe(true);
      expect(p.images.length).toBeGreaterThan(0);
      expect(p.address.street.he && p.address.street.en).toBeTruthy();
      if (p.score) {
        const weighted = Math.round(p.score.subScores.reduce((s, x) => s + x.value * x.weight, 0));
        expect(p.score.total).toBe(weighted);
      }
    }
  });

  it('includes unscored, sold and brand-new listings to exercise those states', () => {
    const { properties } = mockData();
    expect(properties.some((p) => !p.score)).toBe(true);
    expect(properties.some((p) => p.status === 'sold')).toBe(true);
    expect(properties.some((p) => Date.now() - Date.parse(p.createdAt) < 3 * 24 * 3600 * 1000)).toBe(true);
  });

  it('uses the displayed context to calculate scores and exercises partial coverage', () => {
    const { properties } = mockData();
    expect(properties.some((p) => p.score?.confidence === 'medium')).toBe(true);
    expect(properties.some((p) => p.score?.confidence === 'low')).toBe(true);
    expect(properties.some((p) => p.plans?.length === 0)).toBe(true);
    for (const p of properties) {
      if (p.score)
        expect(p.score).toEqual(
          computeScore({
            ...p,
            property: p,
            comparableCount: p.comparableDeals.length,
            computedAt: p.score.computedAt,
          }),
        );
      const history = p.market.priceHistory!;
      expect(history.at(-1)!.pricePerSqm).toBe(p.market.neighborhoodMedianPricePerSqm);
      expect(history.at(-1)!.pricePerSqm / history[0].pricePerSqm - 1).toBeCloseTo(p.market.fiveYearChange, 3);
      for (const plan of p.plans ?? []) {
        const ring = plan.geometry.coordinates[0];
        expect(ring[0]).toEqual(ring.at(-1));
        expect(plan.planNumber).toMatch(/^DEMO-/);
      }
    }
  });
});

describe('properties repository', () => {
  it('returns only active listings inside the bbox', async () => {
    const bbox = regionToBbox(DEFAULT_REGION);
    const rows = await getPropertiesInBbox(bbox, EMPTY_FILTERS);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.status === 'active' && inBbox(r.location, bbox))).toBe(true);
  });

  it('applies filters', async () => {
    const rows = await getPropertiesInBbox(ISRAEL, { ...EMPTY_FILTERS, roomsMin: 4, minScore: 65 });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.rooms >= 4 && (r.scoreTotal ?? 0) >= 65)).toBe(true);
  });

  it('returns the full listing with context, or null', async () => {
    const detail = await getProperty('p-0001');
    expect(detail?.comparableDeals.length).toBeGreaterThan(0);
    expect(detail?.market.neighborhoodMedianPricePerSqm).toBeGreaterThan(0);
    await expect(getProperty('nope')).resolves.toBeNull();
  });

  it('returns saved listings in the requested order and skips unknown ids', async () => {
    const rows = await getPropertiesByIds(['p-0003', 'missing', 'p-0001']);
    expect(rows.map((r) => r.id)).toEqual(['p-0003', 'p-0001']);
  });

  it('searches places in both languages', async () => {
    expect((await searchPlaces('florentin')).map((p) => p.id)).toContain('florentin');
    expect((await searchPlaces('פלורנטין')).map((p) => p.id)).toContain('florentin');
    expect((await searchPlaces('ramat gan')).some((p) => p.kind === 'city')).toBe(true);
    await expect(searchPlaces('  ')).resolves.toEqual([]);
  });
});
