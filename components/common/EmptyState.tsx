import * as React from 'react';
import { View } from 'react-native';

import { Card, type CardProps } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { glows } from '@/constants/theme';
import type { IconName } from '@/constants/icons';
import { cn } from '@/lib/utils/cn';

type EmptyStateProps = {
  icon: IconName;
  title: string;
  body?: string;
  action?: React.ReactNode;
  tone?: CardProps['tone'];
  className?: string;
};

export function EmptyState({ icon, title, body, action, tone = 'default', className }: EmptyStateProps) {
  return (
    <Card tone={tone} className={cn('items-center gap-3 py-10', className)}>
      <View
        className="mb-1 h-16 w-16 items-center justify-center rounded-full border border-primary/40 bg-background"
        style={{ boxShadow: glows.primary }}
      >
        <Icon name={icon} size={28} className="text-primary" />
      </View>
      <Text variant="h2" className="text-center">
        {title}
      </Text>
      {body ? (
        <Text variant="muted" className="text-center">
          {body}
        </Text>
      ) : null}
      {action}
    </Card>
  );
}
