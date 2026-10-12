import 'expo-sqlite/localStorage/install';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type SavedState = {
  /** Most recently saved first. */
  ids: string[];
  toggle: (id: string) => void;
};

export const useSavedStore = create<SavedState>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) => set((s) => ({ ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [id, ...s.ids] })),
    }),
    {
      name: 'saved',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function useIsSaved(id: string) {
  return useSavedStore((s) => s.ids.includes(id));
}
