import { useColorScheme } from 'nativewind';

import { colors, type Palette } from '@/constants/theme';

/** Active color tokens as hex, for native props that can't take a className. */
export function usePalette(): Palette {
  const { colorScheme } = useColorScheme();
  return colorScheme === 'dark' ? colors.dark : colors.light;
}
