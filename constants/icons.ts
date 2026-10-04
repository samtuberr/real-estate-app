import type { SymbolViewProps } from 'expo-symbols';

export type AppIcon = Extract<SymbolViewProps['name'], { ios?: unknown }>;

/**
 * Every icon in the app: an SF Symbol for iOS and a Material Symbol for Android/web
 * (spec §7). Add new icons here instead of inlining names in screens.
 */
export const icons = {
  explore: { ios: 'map.fill', android: 'explore', web: 'explore' },
  saved: { ios: 'heart.fill', android: 'favorite', web: 'favorite' },
  mortgage: { ios: 'banknote.fill', android: 'payments', web: 'payments' },
  learn: { ios: 'graduationcap.fill', android: 'school', web: 'school' },
  profile: { ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  filters: { ios: 'slider.horizontal.3', android: 'tune', web: 'tune' },
  location: { ios: 'location.fill', android: 'my_location', web: 'my_location' },
  mapPin: { ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' },
  mapOff: { ios: 'mappin.slash', android: 'location_off', web: 'location_off' },
  info: { ios: 'info.circle', android: 'info', web: 'info' },
  sparkles: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
  chevronForward: { ios: 'chevron.forward', android: 'chevron_right', web: 'chevron_right' },
} as const satisfies Record<string, AppIcon>;

export type IconName = keyof typeof icons;
