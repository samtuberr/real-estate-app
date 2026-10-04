import 'expo-sqlite/localStorage/install';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Locale } from '@/lib/i18n/locales';

export type ThemePreference = 'system' | 'light' | 'dark';

type SettingsState = {
  /** `null` until the user picks one — the device locale is used meanwhile. */
  locale: Locale | null;
  /** Dark ("deep space") is the signature look, so it's the default (spec §7). */
  theme: ThemePreference;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: ThemePreference) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      locale: null,
      theme: 'dark',
      setLocale: (locale) => set({ locale }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'settings',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ locale, theme }) => ({ locale, theme }),
    },
  ),
);

/** Writes settings to storage immediately — needed before an app reload. */
export async function flushSettings() {
  const { storage, name, partialize, version } = useSettingsStore.persist.getOptions();
  if (!storage || !name || !partialize) return;
  await storage.setItem(name, { state: partialize(useSettingsStore.getState()), version });
}
