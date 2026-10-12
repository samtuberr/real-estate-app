import { Host, Slider } from '@expo/ui';
import { useColorScheme } from 'nativewind';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Num } from '@/components/common/Num';
import { usePalette } from '@/lib/usePalette';

export type RangeControlProps = {
  label: string;
  valueLabel: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
};

export function RangeControl({ label, valueLabel, onChange, ...props }: RangeControlProps) {
  const { colorScheme } = useColorScheme();
  const palette = usePalette();
  return (
    <View className="gap-2">
      <Text variant="label">{label}</Text>
      <Num variant="muted">{valueLabel}</Num>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min: props.min, max: props.max, now: props.value, text: valueLabel }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) =>
          onChange(
            Math.min(
              props.max,
              Math.max(
                props.min,
                props.value + (event.nativeEvent.actionName === 'increment' ? props.step : -props.step),
              ),
            ),
          )
        }
      >
        <Host
          colorScheme={colorScheme}
          seedColor={palette.primary}
          matchContents={{ vertical: true }}
          style={{ width: '100%', minHeight: 44 }}
        >
          <Slider {...props} onValueChange={onChange} testID={label} />
        </Host>
      </View>
    </View>
  );
}
