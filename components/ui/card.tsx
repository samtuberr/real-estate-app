import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { View, type ViewProps } from 'react-native';

import { Text, type TextProps } from '@/components/ui/text';
import { cn } from '@/lib/utils/cn';

// Hierarchy comes from surface contrast, not drop shadows (spec §7).
const cardVariants = cva('rounded-3xl p-5', {
  variants: {
    tone: {
      default: 'bg-card',
      aurora: 'bg-tone-aurora',
      solar: 'bg-tone-solar',
      nebula: 'bg-tone-nebula',
      ion: 'bg-tone-ion',
    },
  },
  defaultVariants: { tone: 'default' },
});

export type CardProps = ViewProps & VariantProps<typeof cardVariants>;

export function Card({ className, tone, style, ...props }: CardProps) {
  return (
    <View
      className={cn(cardVariants({ tone }), className)}
      style={[{ borderCurve: 'continuous' }, style]}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ViewProps) {
  return <View className={cn('mb-3 gap-1', className)} {...props} />;
}

export function CardTitle({ className, ...props }: TextProps) {
  return <Text role="heading" variant="h2" className={className} {...props} />;
}

export function CardDescription({ className, ...props }: TextProps) {
  return <Text variant="muted" className={className} {...props} />;
}

export function CardContent({ className, ...props }: ViewProps) {
  return <View className={cn('gap-3', className)} {...props} />;
}

export function CardFooter({ className, ...props }: ViewProps) {
  return <View className={cn('mt-4 flex-row items-center gap-3', className)} {...props} />;
}
