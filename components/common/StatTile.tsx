import * as React from 'react';

import { Card, type CardProps } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils/cn';

type StatTileProps = {
  label: string;
  /** Usually a `<Num>` or `<Money>` so the figure stays LTR. */
  value: React.ReactNode;
  tone?: CardProps['tone'];
  className?: string;
};

/** Big bold figure with a small muted label (spec §7). */
export function StatTile({ label, value, tone = 'default', className }: StatTileProps) {
  return (
    <Card tone={tone} className={cn('flex-1 gap-1 p-4', className)}>
      <Text variant="caption">{label}</Text>
      {value}
    </Card>
  );
}
