import '../global.css';

import {
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_600SemiBold,
  Rubik_700Bold,
  useFonts,
} from '@expo-google-fonts/rubik';
import { QueryClientProvider } from '@tanstack/react-query';
import { SplashScreen, Stack } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { colors } from '@/constants/theme';
import { queryClient } from '@/lib/api/queryClient';
import { useAppBootstrap } from '@/lib/bootstrap';
import { useSettingsStore } from '@/stores/settings';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_600SemiBold,
    Rubik_700Bold,
  });
  const ready = useAppBootstrap();
  const theme = useSettingsStore((s) => s.theme);
  const { colorScheme, setColorScheme } = useColorScheme();
  const fontsDone = fontsLoaded || !!fontError;

  useEffect(() => {
    setColorScheme(theme);
  }, [theme, setColorScheme]);

  useEffect(() => {
    if (fontsDone && ready) SplashScreen.hideAsync();
  }, [fontsDone, ready]);

  if (!fontsDone || !ready) return null;

  const dark = colorScheme === 'dark';
  const palette = dark ? colors.dark : colors.light;
  const base = dark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: palette.primary,
      background: palette.background,
      card: palette.card,
      text: palette.foreground,
      border: palette.border,
    },
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={navTheme}>
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.background }}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.background } }}>
            <Stack.Screen
              name="property/[id]/index"
              options={{
                headerShown: true,
                headerTransparent: true,
                title: '',
                headerTintColor: palette.foreground,
                headerBackButtonDisplayMode: 'minimal',
              }}
            />
            <Stack.Screen
              name="property/[id]/score"
              options={{
                headerShown: true,
                headerTintColor: palette.foreground,
                headerBackButtonDisplayMode: 'minimal',
                headerTitleStyle: { fontFamily: 'Rubik_600SemiBold' },
              }}
            />
            <Stack.Screen
              name="property/[id]/plans"
              options={{
                headerShown: true,
                headerTintColor: palette.foreground,
                headerBackButtonDisplayMode: 'minimal',
                headerTitleStyle: { fontFamily: 'Rubik_600SemiBold' },
              }}
            />
            <Stack.Screen
              name="property/[id]/gallery"
              options={{
                presentation: 'fullScreenModal',
                animation: 'fade',
                contentStyle: { backgroundColor: colors.dark.background },
              }}
            />
            <Stack.Screen
              name="filters"
              options={{
                presentation: 'formSheet',
                sheetAllowedDetents: [0.75, 1],
                sheetGrabberVisible: true,
                sheetCornerRadius: 28,
              }}
            />
          </Stack>
          <StatusBar style={dark ? 'light' : 'dark'} />
        </GestureHandlerRootView>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
