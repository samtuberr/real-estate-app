import { useId } from 'react';
import { View } from 'react-native';
import { Num } from '@/components/common/Num';
import { Text } from '@/components/ui/text';
import type { RangeControlProps } from './RangeControl';

/** @expo/ui's web Slider does not forward a label to its input; use a labeled
 * HTML range so keyboard and screen-reader users operate the same control. */
export function RangeControl({ label, valueLabel, onChange, value, min, max, step }: RangeControlProps) {
  const id = useId();
  return (
    <View className="gap-2">
      <Text nativeID={id} variant="label">
        {label}
      </Text>
      <Num variant="muted">{valueLabel}</Num>
      <input
        type="range"
        aria-labelledby={id}
        aria-valuetext={valueLabel}
        data-testid={label}
        className="h-11 w-full cursor-pointer accent-primary"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </View>
  );
}
