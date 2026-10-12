import { LinearGradient, vec } from '@shopify/react-native-skia';
import { View } from 'react-native';
import { CartesianChart, Line } from 'victory-native';
import type { MarketStats } from '@/lib/domain/types';
import { usePalette } from '@/lib/usePalette';

export type PriceTrendChartProps = { history: NonNullable<MarketStats['priceHistory']> };

/** Axis labels and an accessible data table live in PriceTrend, shared with web. */
export function PriceTrendChart({ history }: PriceTrendChartProps) {
  const palette = usePalette();
  return (
    <View className="h-40" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <CartesianChart
        data={history}
        xKey="year"
        yKeys={['pricePerSqm']}
        padding={8}
        domainPadding={{ top: 20, bottom: 20 }}
      >
        {({ points, chartBounds }) => (
          <Line points={points.pricePerSqm} strokeWidth={3} curveType="linear">
            <LinearGradient
              start={vec(chartBounds.left, 0)}
              end={vec(chartBounds.right, 0)}
              colors={[palette.primary, palette.plasma]}
            />
          </Line>
        )}
      </CartesianChart>
    </View>
  );
}
