import * as React from 'react';
import { View, type ViewProps } from 'react-native';

import { cn } from '@/lib/utils/cn';

export type ProgressProps = ViewProps & {
  /** 0–100 */
  value: number;
  indicatorClassName?: string;
};

export function Progress({ value, className, indicatorClassName, ...props }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <View
      role="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}
      {...props}
    >
      <View className={cn('h-full rounded-full bg-primary', indicatorClassName)} style={{ width: `${clamped}%` }} />
    </View>
  );
}
