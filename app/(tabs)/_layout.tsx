import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { icons } from '@/constants/icons';
import { usePalette } from '@/lib/usePalette';

const TABS = ['explore', 'saved', 'mortgage', 'learn', 'profile'] as const;

/**
 * Platform tab bar (spec §7): Liquid Glass on iOS 26+ (minimizes while scrolling),
 * Material 3 navigation bar on Android. Never a custom floating bar.
 */
export default function TabsLayout() {
  const { t } = useTranslation('tabs');
  const palette = usePalette();

  return (
    <NativeTabs
      minimizeBehavior="onScrollDown"
      tintColor={palette.primary}
      // iOS keeps the system glass material; Android gets the app surface color.
      backgroundColor={Platform.OS === 'ios' ? undefined : palette.background}
      indicatorColor={`${palette.primary}33`}
      labelStyle={{ fontFamily: 'Rubik_500Medium' }}
    >
      {TABS.map((name) => (
        <NativeTabs.Trigger key={name} name={name}>
          <NativeTabs.Trigger.Icon sf={icons[name].ios} md={icons[name].android} />
          <NativeTabs.Trigger.Label>{t(name)}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
