import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils/cn';

export function Disclaimer({ text, className }: { text?: string; className?: string }) {
  const { t } = useTranslation();
  return (
    <View className={cn('flex-row items-start gap-2', className)}>
      <Icon name="info" size={14} className="mt-0.5 text-muted-foreground" />
      <Text variant="caption" className="flex-1">
        {text ?? t('disclaimer')}
      </Text>
    </View>
  );
}
