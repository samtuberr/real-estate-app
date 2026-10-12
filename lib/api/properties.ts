/**
 * Properties repository (backend-spec §10). Screens never call this directly — they use
 * the TanStack Query hooks in `lib/api/queries.ts`. In M2 it reads the bundled mock;
 * B2 swaps the bodies for Supabase (`properties_in_bbox`, `property-detail`) with the
 * same signatures.
 */
import { matchesFilters } from '@/lib/domain/filters';
import type { Bbox, Place, Property, PropertyDetail, PropertyFilters, PropertySummary } from '@/lib/domain/types';
import { inBbox } from '@/lib/map/region';

import { mockData } from './mock/data';

/** Simulated network latency, so loading states are exercised in development. */
const LATENCY_MS = process.env.NODE_ENV === 'test' ? 0 : 250;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));
}

export function toSummary(p: Property): PropertySummary {
  return {
    id: p.id,
    status: p.status,
    price: p.price,
    location: p.location,
    address: p.address,
    rooms: p.rooms,
    sizeSqm: p.sizeSqm,
    floor: p.floor,
    propertyType: p.propertyType,
    features: p.features,
    createdAt: p.createdAt,
    scoreTotal: p.score?.total,
    thumbnail: p.images[0],
  };
}

/** `GET /properties?bbox=&filters=` — active listings inside the viewport that match the filters. */
export async function getPropertiesInBbox(bbox: Bbox, filters: PropertyFilters, limit = 500): Promise<PropertySummary[]> {
  const rows = mockData()
    .properties.filter((p) => inBbox(p.location, bbox))
    .map(toSummary)
    .filter((p) => matchesFilters(p, filters))
    .slice(0, limit);
  return delay(rows);
}

/** `GET /properties/:id` — the full listing with its context, or `null` if it doesn't exist. */
export async function getProperty(id: string): Promise<PropertyDetail | null> {
  return delay(mockData().properties.find((p) => p.id === id) ?? null);
}

/** Saved listings, in the order they were saved. Includes sold / off-market ones so the user sees what changed. */
export async function getPropertiesByIds(ids: readonly string[]): Promise<PropertySummary[]> {
  const byId = new Map(mockData().properties.map((p) => [p.id, p]));
  return delay(ids.flatMap((id) => {
    const p = byId.get(id);
    return p ? [toSummary(p)] : [];
  }));
}

/** Cities and neighborhoods matching a query in either language. */
export async function searchPlaces(query: string, limit = 6): Promise<Place[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits = mockData().places.filter(
    (p) => p.name.he.includes(q) || p.name.en.toLowerCase().includes(q) || p.city?.he.includes(q) || p.city?.en.toLowerCase().includes(q),
  );
  return delay(hits.slice(0, limit));
}
