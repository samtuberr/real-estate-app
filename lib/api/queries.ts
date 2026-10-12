import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { Bbox, PropertyFilters } from '@/lib/domain/types';
import { snapBbox } from '@/lib/map/region';

import { getPropertiesByIds, getPropertiesInBbox, getProperty, searchPlaces } from './properties';

export const queryKeys = {
  bbox: (bbox: Bbox, filters: PropertyFilters) => ['properties', 'bbox', bbox, filters] as const,
  property: (id: string) => ['properties', 'detail', id] as const,
  byIds: (ids: readonly string[]) => ['properties', 'byIds', ids] as const,
  places: (query: string) => ['places', query] as const,
};

/** Listings in the map viewport. Keeps the previous result while panning so markers don't blink. */
export function usePropertiesInBbox(bbox: Bbox, filters: PropertyFilters) {
  const snapped = snapBbox(bbox);
  return useQuery({
    queryKey: queryKeys.bbox(snapped, filters),
    queryFn: () => getPropertiesInBbox(snapped, filters),
    placeholderData: keepPreviousData,
  });
}

export function useProperty(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.property(id ?? ''),
    queryFn: () => getProperty(id!),
    enabled: !!id,
  });
}

export function usePropertiesByIds(ids: readonly string[]) {
  return useQuery({
    queryKey: queryKeys.byIds(ids),
    queryFn: () => getPropertiesByIds(ids),
    placeholderData: keepPreviousData,
  });
}

export function usePlaceSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: queryKeys.places(q),
    queryFn: () => searchPlaces(q),
    enabled: q.length > 0,
    placeholderData: keepPreviousData,
  });
}
