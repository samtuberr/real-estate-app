import { View } from 'react-native';
import Svg, { Line, Polyline } from 'react-native-svg';
import { usePalette } from '@/lib/usePalette';
import type { AmortizationChartProps } from './AmortizationChart';

export function AmortizationChart({ data }: AmortizationChartProps) {
  const palette = usePalette();
  const max = Math.max(1, ...data.flatMap((row) => [row.principal, row.interest]));
  const points = (key: 'principal' | 'interest') =>
    data.map((row, i) => `${8 + (i / Math.max(1, data.length - 1)) * 304},${190 - (row[key] / max) * 172}`).join(' ');
  return (
    <View className="h-52" aria-hidden>
      <Svg width="100%" height="100%" viewBox="0 0 320 208" preserveAspectRatio="none">
        <Line x1={8} x2={312} y1={190} y2={190} stroke={palette.border} />
        <Polyline points={points('principal')} fill="none" stroke={palette.primary} strokeWidth={3} />
        <Polyline points={points('interest')} fill="none" stroke={palette.plasma} strokeWidth={3} />
      </Svg>
    </View>
  );
}
