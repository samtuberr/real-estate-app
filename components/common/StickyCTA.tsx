import * as React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glass } from '@/components/ui/glass';

/** Glass bar pinned to the bottom of a screen for its primary action (spec §7). */
export function StickyCTA({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" className="absolute bottom-0 start-0 end-0 px-4" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
      <Glass className="rounded-full p-2">{children}</Glass>
    </View>
  );
}
