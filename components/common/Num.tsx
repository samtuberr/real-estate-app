import * as React from 'react';

import { Text, type TextProps } from '@/components/ui/text';

// Unicode LEFT-TO-RIGHT ISOLATE … POP DIRECTIONAL ISOLATE.
const LRI = '⁦';
const PDI = '⁩';

/**
 * Keeps numbers, prices and phone numbers LTR inside RTL text (spec §2.1), with
 * tabular figures so changing values don't jitter. Uses a bidi isolate rather than
 * `writingDirection: 'ltr'`, which would also left-align the text in RTL layouts.
 */
export function Num({ style, children, ...props }: TextProps) {
  const content = typeof children === 'string' || typeof children === 'number' ? `${LRI}${children}${PDI}` : children;
  return (
    <Text style={[{ fontVariant: ['tabular-nums'] }, style]} {...props}>
      {content}
    </Text>
  );
}
