import * as React from 'react';
import { View, type ViewProps } from 'react-native';

import { cn } from '@/lib/utils/cn';

export function Separator({
  className,
  orientation = 'horizontal',
  ...props
}: ViewProps & { orientation?: 'horizontal' | 'vertical' }) {
  return (
    <View
      role="separator"
      className={cn('bg-border', orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px', className)}
      {...props}
    />
  );
}
