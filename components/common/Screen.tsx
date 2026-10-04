import * as React from 'react';
import { ScrollView, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils/cn';

type ScreenProps = {
  /** Shown under the native large title. The title itself comes from the tab's Stack. */
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * Scrolling screen body for stack/tab screens. The ScrollView must stay the first
 * child so the native header and tab bar get scroll-edge effects, minimize-on-scroll
 * and scroll-to-top.
 */
export function Screen({ subtitle, children, className }: ScreenProps) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-background"
      contentContainerClassName={cn('px-5 pb-12 pt-2', className)}
      showsVerticalScrollIndicator={false}
    >
      <NebulaGlow />
      {subtitle ? (
        <Text variant="muted" className="mb-8">
          {subtitle}
        </Text>
      ) : null}
      {children}
    </ScrollView>
  );
}

/** Faint ion-blue nebula behind the top of every screen — the "deep space" backdrop. */
export function NebulaGlow({ className }: { className?: string }) {
  return (
    <View
      pointerEvents="none"
      className={cn('absolute -top-40 start-0 end-0 h-96 opacity-60 dark:opacity-100', className)}
      style={{
        experimental_backgroundImage:
          'radial-gradient(ellipse at 50% 0%, rgba(110, 123, 255, 0.28) 0%, rgba(62, 230, 255, 0.08) 45%, transparent 75%)',
      }}
    />
  );
}
