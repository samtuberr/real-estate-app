import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';

import type { PropertyMapProps } from './PropertyMap';

export type { PropertyMapHandle, PropertyMapProps } from './PropertyMap';

/** react-native-maps has no web implementation; the web preview shows a placeholder behind the sheet. */
export function PropertyMap({ padding }: PropertyMapProps) {
  const { t } = useTranslation('explore');
  return (
    <View className="flex-1 bg-background px-5" style={{ paddingTop: padding.top + 24 }}>
      <EmptyState tone="ion" icon="explore" title={t('webTitle')} body={t('webBody')} />
    </View>
  );
}
