import { View } from 'react-native';
import { CartesianChart, Line } from 'victory-native';
import type { annualSchedule } from '@/lib/domain/mortgage/plans';
import { usePalette } from '@/lib/usePalette';

export type AmortizationChartProps = { data: ReturnType<typeof annualSchedule> };
export function AmortizationChart({ data }: AmortizationChartProps) {
  const palette = usePalette();
  return (
    <View className="h-52" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <CartesianChart
        data={data}
        xKey="year"
        yKeys={['principal', 'interest']}
        padding={8}
        domain={{ y: [0] }}
        domainPadding={{ top: 20 }}
      >
        {({ points }) => (
          <>
            <Line points={points.principal} color={palette.primary} strokeWidth={3} curveType="linear" />
            <Line points={points.interest} color={palette.plasma} strokeWidth={3} curveType="linear" />
          </>
        )}
      </CartesianChart>
    </View>
  );
}
