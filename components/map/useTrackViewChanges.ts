import { useEffect, useState } from 'react';

/**
 * Custom marker views are snapshotted on Android. Track changes briefly after the
 * marker's look changes so the snapshot is up to date, then stop — leaving
 * `tracksViewChanges` on for every marker is the main map performance killer.
 */
export function useTrackViewChanges(...deps: unknown[]) {
  const key = JSON.stringify(deps);
  const [settledKey, setSettledKey] = useState<string | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setSettledKey(key), 400);
    return () => clearTimeout(timer);
  }, [key]);
  return settledKey !== key;
}
