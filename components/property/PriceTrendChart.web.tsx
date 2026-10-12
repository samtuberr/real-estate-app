import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Polyline, Stop } from 'react-native-svg';
import { usePalette } from '@/lib/usePalette';
import type { PriceTrendChartProps } from './PriceTrendChart';

export function PriceTrendChart({ history }: PriceTrendChartProps) {
  const palette = usePalette();
  const id = useId();
  const min = Math.min(...history.map((p) => p.pricePerSqm));
  const max = Math.max(...history.map((p) => p.pricePerSqm));
  const first = history[0].year;
  const span = history[history.length - 1].year - first || 1;
  const points = history
    .map(
      (p) =>
        `${8 + ((p.year - first) / span) * 304},${max === min ? 80 : 140 - ((p.pricePerSqm - min) / (max - min)) * 120}`,
    )
    .join(' ');
  return (
    <View className="h-40" aria-hidden>
      <Svg width="100%" height="100%" viewBox="0 0 320 160" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={palette.primary} />
            <Stop offset="1" stopColor={palette.plasma} />
          </LinearGradient>
        </Defs>
        <Polyline points={points} fill="none" stroke={`url(#${id})`} strokeWidth={3} />
      </Svg>
    </View>
  );
}
