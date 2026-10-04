import 'expo-sqlite/localStorage/install';

import { useEffect, useState } from 'react';

import { initI18n } from '@/lib/i18n';
import { applyDirection, reloadApp } from '@/lib/i18n/direction';
import { getDeviceLocale } from '@/lib/i18n/locales';
import { useSettingsStore } from '@/stores/settings';

const RELOAD_GUARD_KEY = 'direction-reload-attempt';

function useSettingsHydrated() {
  const [hydrated, setHydrated] = useState(() => useSettingsStore.persist.hasHydrated());
  useEffect(() => {
    const unsubscribe = useSettingsStore.persist.onFinishHydration(() => setHydrated(true));
    if (useSettingsStore.persist.hasHydrated()) setHydrated(true);
    return unsubscribe;
  }, []);
  return hydrated;
}

/**
 * Hydrates persisted settings, starts i18n and makes sure the native layout
 * direction matches the locale — reloading once if it doesn't (spec §6).
 */
export function useAppBootstrap() {
  const hydrated = useSettingsHydrated();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;

    (async () => {
      const locale = useSettingsStore.getState().locale ?? getDeviceLocale();
      initI18n(locale);

      if (applyDirection(locale)) {
        // Guard against a reload loop if the platform ignores forceRTL.
        const attempted = localStorage.getItem(RELOAD_GUARD_KEY);
        if (attempted !== locale) {
          localStorage.setItem(RELOAD_GUARD_KEY, locale);
          await reloadApp();
          return;
        }
        console.warn(`[bootstrap] Layout direction for "${locale}" did not apply after reload.`);
      }
      localStorage.removeItem(RELOAD_GUARD_KEY);
      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated]);

  return ready;
}
