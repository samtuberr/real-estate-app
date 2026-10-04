import * as React from 'react';
import { TextInput } from 'react-native';

import { cn } from '@/lib/utils/cn';

export type InputProps = React.ComponentProps<typeof TextInput>;

export function Input({ className, ...props }: InputProps) {
  return (
    <TextInput
      className={cn(
        'min-h-12 rounded-2xl border border-input bg-secondary px-4 font-sans text-body text-foreground',
        'placeholder:text-muted-foreground focus:border-ring',
        props.editable === false && 'opacity-50',
        className,
      )}
      {...props}
    />
  );
}
