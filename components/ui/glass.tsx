import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { cssInterop, useColorScheme } from 'nativewind';
import * as React from 'react';
import { AccessibilityInfo, Platform, View, type ViewProps } from 'react-native';

import { cn } from '@/lib/utils/cn';

const liquidGlass = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

function useReduceTransparency() {
  const [enabled, setEnabled] = React.useState(false);
  React.useEffect(() => {
    // iOS-only setting; react-native-web doesn't implement it.
    if (Platform.OS !== 'ios') return;
    AccessibilityInfo.isReduceTransparencyEnabled().then(setEnabled);
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setEnabled);
    return () => sub.remove();
  }, []);
  return enabled;
}

export type GlassProps = ViewProps & {
  className?: string;
  /** Only for real controls (buttons, pressables) — never for background surfaces. */
  interactive?: boolean;
};

/**
 * Floating translucent surface (spec §7): Liquid Glass on iOS 26+, a blurred
 * material on older iOS and web, a translucent Material tonal surface on Android,
 * and a solid card when Reduce Transparency is on.
 * Never wrap it in `overflow-hidden` or animate its opacity.
 */
export function Glass({ className, interactive = false, style, children, ...props }: GlassProps) {
  const { colorScheme } = useColorScheme();
  const reduceTransparency = useReduceTransparency();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';

  if (reduceTransparency || Platform.OS === 'android') {
    return (
      <View
        className={cn(reduceTransparency ? 'bg-card' : 'border border-foreground/10 bg-card/90', className)}
        style={style}
        {...props}
      >
        {children}
      </View>
    );
  }

  if (liquidGlass) {
    return (
      <GlassView
        isInteractive={interactive}
        colorScheme={scheme}
        className={className}
        style={[{ borderCurve: 'continuous' }, style]}
        {...props}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <BlurView
      tint={scheme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
      intensity={80}
      className={cn('overflow-hidden border border-foreground/10', className)}
      style={style}
      {...props}
    >
      {children}
    </BlurView>
  );
}

cssInterop(GlassView, { className: 'style' });
cssInterop(BlurView, { className: 'style' });
