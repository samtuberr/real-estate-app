import * as React from 'react';

import { Text, type TextProps } from '@/components/ui/text';

/**
 * Keeps numbers, prices and phone numbers LTR inside RTL text (spec §2.1), with
 * tabular figures so changing values don't jitter.
 */
export function Num({ style, ...props }: TextProps) {
  return <Text style={[{ writingDirection: 'ltr', fontVariant: ['tabular-nums'] }, style]} {...props} />;
}
