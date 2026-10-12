import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui/text';
import type { PropertySummary } from '@/lib/domain/types';
import { useLocale } from '@/lib/i18n/useLocale';
import { formatNumber } from '@/lib/utils/format';

type PropertySpecsProps = {
  property: Pick<PropertySummary, 'rooms' | 'sizeSqm' | 'floor'> & { totalFloors?: number };
  className?: string;
};

/** "3.5 rooms · 92 sqm · Floor 4/8" */
export function PropertySpecs({ property, className }: PropertySpecsProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  const { rooms, sizeSqm, floor, totalFloors } = property;
  const parts = [t('roomsValue', { value: formatNumber(rooms, locale) }), t('sqmValue', { value: formatNumber(sizeSqm, locale) })];
  if (floor != null) {
    parts.push(
      floor === 0 ? t('groundFloor') : totalFloors ? t('floorOf', { floor, total: totalFloors }) : t('floorValue', { floor }),
    );
  }
  return (
    <Text variant="muted" className={className} numberOfLines={1}>
      {parts.join(' · ')}
    </Text>
  );
}
