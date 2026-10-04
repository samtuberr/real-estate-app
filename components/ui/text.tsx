import * as Slot from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Text as RNText } from 'react-native';

import { cn } from '@/lib/utils/cn';

/** Lets a parent (e.g. Button) style the Text nodes it renders. */
export const TextClassContext = React.createContext<string | undefined>(undefined);

export const textVariants = cva('font-sans text-body text-foreground', {
  variants: {
    variant: {
      hero: 'font-sans-bold text-hero',
      display: 'font-sans-bold text-display',
      h1: 'font-sans-semibold text-h1',
      h2: 'font-sans-semibold text-h2',
      body: '',
      label: 'font-sans-medium text-body',
      caption: 'text-caption text-muted-foreground',
      muted: 'text-muted-foreground',
    },
  },
  defaultVariants: { variant: 'body' },
});

export type TextProps = React.ComponentProps<typeof RNText> &
  VariantProps<typeof textVariants> & { asChild?: boolean };

export function Text({ className, variant, asChild = false, ...props }: TextProps) {
  const textClass = React.use(TextClassContext);
  const Component = asChild ? Slot.Text : RNText;
  return <Component className={cn(textVariants({ variant }), textClass, className)} {...props} />;
}
