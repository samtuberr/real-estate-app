import * as Haptics from 'expo-haptics';
import * as React from 'react';
import { type GestureResponderEvent, Pressable } from 'react-native';

import { Text, TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils/cn';

export type ChipProps = Omit<React.ComponentProps<typeof Pressable>, 'children'> & {
  label: string;
  selected?: boolean;
  icon?: React.ReactNode;
};

/** Pill-shaped toggle used for filters and single/multi-select options. Ticks on selection. */
export function Chip({ label, selected = false, icon, className, onPress, ...props }: ChipProps) {
  const handlePress = (e: GestureResponderEvent) => {
    if (!selected) Haptics.selectionAsync();
    onPress?.(e);
  };
  return (
    <TextClassContext value={selected ? 'text-primary-foreground' : 'text-foreground'}>
      <Pressable
        role="button"
        accessibilityState={{ selected }}
        className={cn(
          'min-h-11 flex-row items-center gap-2 rounded-full border px-4 active:opacity-80',
          selected ? 'border-primary bg-primary' : 'border-border bg-secondary',
          className,
        )}
        onPress={handlePress}
        {...props}
      >
        {icon}
        <Text className="font-sans-medium">{label}</Text>
      </Pressable>
    </TextClassContext>
  );
}
