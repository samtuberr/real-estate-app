import * as React from 'react';

import { Num } from '@/components/common/Num';
import type { TextProps } from '@/components/ui/text';
import { useLocale } from '@/lib/i18n/useLocale';
import { formatCurrency } from '@/lib/utils/format';

export function Money({ value, ...props }: Omit<TextProps, 'children'> & { value: number }) {
  const locale = useLocale();
  return <Num {...props}>{formatCurrency(value, locale)}</Num>;
}
