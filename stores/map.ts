import 'expo-sqlite/localStorage/install';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { EMPTY_FILTERS } from '@/lib/domain/filters';
import type { PropertyFilters, SortKey } from '@/lib/domain/types';
import { DEFAULT_REGION, type MapRegion } from '@/lib/map/region';

type MapState = {
  region: MapRegion;
  filters: PropertyFilters;
  sort: SortKey;
  /** Marker whose mini card is showing. Not persisted. */
  selectedId: string | null;
  setRegion: (region: MapRegion) => void;
  setFilters: (patch: Partial<PropertyFilters>) => void;
  resetFilters: () => void;
  setSort: (sort: SortKey) => void;
  select: (id: string | null) => void;
};

/** Map region, filters and sort survive tab switches and restarts (spec §4.2, §10). */
export const useMapStore = create<MapState>()(
  persist(
    (set) => ({
      region: DEFAULT_REGION,
      filters: EMPTY_FILTERS,
      sort: 'newest',
      selectedId: null,
      setRegion: (region) => set({ region }),
      setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
      resetFilters: () => set({ filters: EMPTY_FILTERS }),
      setSort: (sort) => set({ sort }),
      select: (selectedId) => set({ selectedId }),
    }),
    {
      name: 'map',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ region, filters, sort }) => ({ region, filters, sort }),
    },
  ),
);
