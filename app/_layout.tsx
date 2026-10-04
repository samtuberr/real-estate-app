import '../global.css';

import {
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_600SemiBold,
  Rubik_700Bold,
  useFonts,
} from '@expo-google-fonts/rubik';
import { SplashScreen, Stack } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { colors } from '@/constants/theme';
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
    <ThemeProvider value={navTheme}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.background }}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.background } }} />
        <StatusBar style={dark ? 'light' : 'dark'} />
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
