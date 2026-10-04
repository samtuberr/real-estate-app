import { cva, type VariantProps } from 'class-variance-authority';
import * as Haptics from 'expo-haptics';
import * as React from 'react';
import { type GestureResponderEvent, Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { TextClassContext } from '@/components/ui/text';
import { glows } from '@/constants/theme';
import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  'flex-row items-center justify-center gap-2 rounded-full active:scale-[0.98] active:opacity-90 disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        secondary: 'bg-secondary',
        outline: 'border border-border bg-card',
        ghost: 'active:bg-muted',
        destructive: 'bg-destructive',
      },
      size: {
        default: 'min-h-12 px-6 py-3',
        sm: 'min-h-11 px-4 py-2',
        lg: 'min-h-14 px-8 py-4',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

const buttonTextVariants = cva('font-sans-semibold text-body', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      outline: 'text-foreground',
      ghost: 'text-foreground',
      destructive: 'text-destructive-foreground',
    },
  },
  defaultVariants: { variant: 'default' },
});

export type ButtonProps = Omit<React.ComponentProps<typeof Pressable>, 'style'> &
  VariantProps<typeof buttonVariants> & { style?: StyleProp<ViewStyle> };

/** Primary buttons glow and give a light haptic tap (spec §7). */
export function Button({ className, variant, size, style, onPress, ...props }: ButtonProps) {
  const primary = (variant ?? 'default') === 'default';
  const handlePress = (e: GestureResponderEvent) => {
    if (primary) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(e);
  };
  return (
    <TextClassContext value={buttonTextVariants({ variant })}>
      <Pressable
        role="button"
        className={cn(buttonVariants({ variant, size }), className)}
        style={[primary && !props.disabled && { boxShadow: glows.primary }, style]}
        onPress={handlePress}
        {...props}
      />
    </TextClassContext>
  );
}

export { buttonTextVariants, buttonVariants };
