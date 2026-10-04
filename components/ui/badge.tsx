import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { View, type ViewProps } from 'react-native';

import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva('flex-row items-center gap-1 self-start rounded-full px-3 py-1', {
  variants: {
    variant: {
      default: 'bg-primary',
      secondary: 'bg-secondary',
      outline: 'border border-border',
      high: 'bg-score-high',
      mid: 'bg-score-mid',
      low: 'bg-score-low',
    },
  },
  defaultVariants: { variant: 'default' },
});

const badgeTextVariants = cva('font-sans-medium text-caption', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      outline: 'text-foreground',
      high: 'text-background',
      mid: 'text-background',
      low: 'text-background',
    },
  },
  defaultVariants: { variant: 'default' },
});

export type BadgeProps = ViewProps & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <TextClassContext value={badgeTextVariants({ variant })}>
      <View className={cn(badgeVariants({ variant }), className)} {...props} />
    </TextClassContext>
  );
}
