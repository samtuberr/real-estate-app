import { activeFilterCount, EMPTY_FILTERS, isNewListing, matchesFilters, pricePerSqm, sortProperties } from './filters';
import type { PropertySummary } from './types';

function listing(overrides: Partial<PropertySummary> = {}): PropertySummary {
  return {
    id: 'a',
    status: 'active',
    price: 2_500_000,
    location: { lat: 32.08, lng: 34.78 },
    address: { city: { he: 'תל אביב', en: 'Tel Aviv' }, street: { he: 'דיזנגוף', en: 'Dizengoff' } },
    rooms: 3,
    sizeSqm: 80,
    floor: 2,
    propertyType: 'apartment',
    features: { elevator: true, parking: 0, mamad: false, balcony: true, storage: false },
    createdAt: '2026-10-01T10:00:00.000Z',
    scoreTotal: 70,
    ...overrides,
  };
}

describe('matchesFilters', () => {
  it('accepts any active listing with empty filters', () => {
    expect(matchesFilters(listing(), EMPTY_FILTERS)).toBe(true);
  });

  it('never matches sold or off-market listings', () => {
    expect(matchesFilters(listing({ status: 'sold' }), EMPTY_FILTERS)).toBe(false);
    expect(matchesFilters(listing({ status: 'off_market' }), EMPTY_FILTERS)).toBe(false);
  });

  it('applies the price range inclusively', () => {
    const f = { ...EMPTY_FILTERS, priceMin: 2_000_000, priceMax: 2_500_000 };
    expect(matchesFilters(listing(), f)).toBe(true);
    expect(matchesFilters(listing({ price: 2_500_001 }), f)).toBe(false);
    expect(matchesFilters(listing({ price: 1_999_999 }), f)).toBe(false);
  });

  it('applies minimum rooms and size', () => {
    expect(matchesFilters(listing(), { ...EMPTY_FILTERS, roomsMin: 3 })).toBe(true);
    expect(matchesFilters(listing(), { ...EMPTY_FILTERS, roomsMin: 4 })).toBe(false);
    expect(matchesFilters(listing(), { ...EMPTY_FILTERS, sizeMin: 90 })).toBe(false);
  });

  it('matches any of the selected property types', () => {
    expect(matchesFilters(listing(), { ...EMPTY_FILTERS, propertyTypes: ['garden', 'apartment'] })).toBe(true);
    expect(matchesFilters(listing(), { ...EMPTY_FILTERS, propertyTypes: ['penthouse'] })).toBe(false);
  });

  it('excludes unscored listings when a minimum score is set', () => {
    expect(matchesFilters(listing(), { ...EMPTY_FILTERS, minScore: 65 })).toBe(true);
    expect(matchesFilters(listing(), { ...EMPTY_FILTERS, minScore: 80 })).toBe(false);
    expect(matchesFilters(listing({ scoreTotal: undefined }), { ...EMPTY_FILTERS, minScore: 50 })).toBe(false);
  });

  it('requires every selected feature, with parking meaning at least one spot', () => {
    expect(matchesFilters(listing(), { ...EMPTY_FILTERS, features: ['elevator', 'balcony'] })).toBe(true);
    expect(matchesFilters(listing(), { ...EMPTY_FILTERS, features: ['elevator', 'mamad'] })).toBe(false);
    expect(matchesFilters(listing(), { ...EMPTY_FILTERS, features: ['parking'] })).toBe(false);
    const withParking = listing({ features: { ...listing().features, parking: 1 } });
    expect(matchesFilters(withParking, { ...EMPTY_FILTERS, features: ['parking'] })).toBe(true);
  });
});

describe('activeFilterCount', () => {
  it('counts filter groups, not values', () => {
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0);
    expect(
      activeFilterCount({ ...EMPTY_FILTERS, priceMin: 1, priceMax: 2, features: ['mamad', 'balcony'], minScore: 50 }),
    ).toBe(3);
  });
});

describe('sortProperties', () => {
  const items = [
    listing({ id: 'a', price: 3, scoreTotal: 50, createdAt: '2026-01-02T00:00:00Z' }),
    listing({ id: 'b', price: 1, scoreTotal: undefined, createdAt: '2026-01-03T00:00:00Z' }),
    listing({ id: 'c', price: 2, scoreTotal: 90, createdAt: '2026-01-01T00:00:00Z' }),
  ];
  const ids = (sort: Parameters<typeof sortProperties>[1]) => sortProperties(items, sort).map((p) => p.id);

  it('sorts by each key', () => {
    expect(ids('newest')).toEqual(['b', 'a', 'c']);
    expect(ids('priceAsc')).toEqual(['b', 'c', 'a']);
    expect(ids('priceDesc')).toEqual(['a', 'c', 'b']);
    expect(ids('score')).toEqual(['c', 'a', 'b']);
  });

  it('does not mutate the input', () => {
    sortProperties(items, 'priceAsc');
    expect(items.map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('helpers', () => {
  it('computes price per sqm', () => {
    expect(pricePerSqm({ price: 2_500_000, sizeSqm: 80 })).toBe(31250);
  });

  it('flags listings from the last three days as new', () => {
    const now = new Date('2026-10-05T12:00:00Z');
    expect(isNewListing('2026-10-03T12:00:01Z', now)).toBe(true);
    expect(isNewListing('2026-10-02T12:00:00Z', now)).toBe(false);
  });
});
