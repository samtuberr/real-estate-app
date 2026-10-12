import type { PropertyFilters, PropertySummary, SortKey } from './types';

export const EMPTY_FILTERS: PropertyFilters = { propertyTypes: [], features: [] };

export function matchesFilters(p: PropertySummary, f: PropertyFilters): boolean {
  if (p.status !== 'active') return false;
  if (f.priceMin != null && p.price < f.priceMin) return false;
  if (f.priceMax != null && p.price > f.priceMax) return false;
  if (f.roomsMin != null && p.rooms < f.roomsMin) return false;
  if (f.sizeMin != null && p.sizeSqm < f.sizeMin) return false;
  if (f.propertyTypes.length > 0 && !f.propertyTypes.includes(p.propertyType)) return false;
  // A listing without a score can't satisfy a minimum score.
  if (f.minScore != null && (p.scoreTotal == null || p.scoreTotal < f.minScore)) return false;
  for (const feature of f.features) {
    if (feature === 'parking' ? p.features.parking < 1 : !p.features[feature]) return false;
  }
  return true;
}

/** Number of active filter groups, for the badge on the filter button. */
export function activeFilterCount(f: PropertyFilters): number {
  return [
    f.priceMin != null || f.priceMax != null,
    f.roomsMin != null,
    f.sizeMin != null,
    f.propertyTypes.length > 0,
    f.minScore != null,
    f.features.length > 0,
  ].filter(Boolean).length;
}

const comparators: Record<SortKey, (a: PropertySummary, b: PropertySummary) => number> = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  priceAsc: (a, b) => a.price - b.price,
  priceDesc: (a, b) => b.price - a.price,
  score: (a, b) => (b.scoreTotal ?? -1) - (a.scoreTotal ?? -1),
};

export function sortProperties<T extends PropertySummary>(items: readonly T[], sort: SortKey): T[] {
  return [...items].sort((a, b) => comparators[sort](a, b) || a.id.localeCompare(b.id));
}

export function pricePerSqm(p: Pick<PropertySummary, 'price' | 'sizeSqm'>): number {
  return Math.round(p.price / p.sizeSqm);
}

/** "New for you" badge: listed within the last `days` days. `now` is passed in (backend-spec §3). */
export function isNewListing(createdAt: string, now: Date, days = 3): boolean {
  return now.getTime() - new Date(createdAt).getTime() < days * 24 * 60 * 60 * 1000;
}
