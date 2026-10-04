import { Stack } from 'expo-router';
import * as React from 'react';
import { Platform } from 'react-native';

import { usePalette } from '@/lib/usePalette';

// iOS 26+ draws its own Liquid Glass scroll-edge effect under transparent headers;
// older iOS needs a blur material so content doesn't collide with the title.
const iosGlassHeaders = Platform.OS === 'ios' && Number.parseInt(String(Platform.Version), 10) >= 26;

type TabStackProps = {
  /** Header title for the tab's root screen. */
  title: string;
  /** The map screen floats its own glass controls instead of a header. */
  headerShown?: boolean;
};

/**
 * Native stack used inside every tab (spec §3): large collapsing title on iOS,
 * Material top app bar on Android. Configure the header here, never rebuild it.
 */
export function TabStack({ title, headerShown = true }: TabStackProps) {
  const palette = usePalette();
  return (
    <Stack
      screenOptions={{
        headerTransparent: Platform.OS === 'ios',
        headerBlurEffect: Platform.OS === 'ios' && !iosGlassHeaders ? 'systemChromeMaterial' : undefined,
        headerShadowVisible: false,
        headerLargeTitleShadowVisible: false,
        headerLargeTitleEnabled: true,
        headerLargeStyle: { backgroundColor: 'transparent' },
        headerStyle: Platform.OS === 'android' ? { backgroundColor: palette.background } : undefined,
        headerTitleStyle: { fontFamily: 'Rubik_600SemiBold', color: palette.foreground },
        headerLargeTitleStyle: { fontFamily: 'Rubik_700Bold', color: palette.foreground },
        headerTintColor: palette.primary,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: palette.background },
      }}
    >
      <Stack.Screen name="index" options={{ title, headerShown }} />
    </Stack>
  );
}
