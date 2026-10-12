import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Num } from '@/components/common/Num';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import type { IconName } from '@/constants/icons';
import type { Property } from '@/lib/domain/types';
import { useLocale } from '@/lib/i18n/useLocale';
import { cn } from '@/lib/utils/cn';
import { formatNumber } from '@/lib/utils/format';

function Row({ icon, label, value }: { icon: IconName; label: string; value: React.ReactNode }) {
  return (
    <View className="min-h-11 flex-row items-center gap-3">
      <Icon name={icon} size={18} className="text-plasma" />
      <Text variant="muted" className="flex-1">
        {label}
      </Text>
      {typeof value === 'string' ? <Text className="font-sans-medium">{value}</Text> : value}
    </View>
  );
}

const BOOLEAN_FEATURES = ['elevator', 'mamad', 'balcony', 'storage'] as const;

/** Building and apartment facts (spec §4.3 item 9). Arnona and vaad bayit estimates arrive with real data. */
export function PropertyDetailsCard({ property }: { property: Property }) {
  const { t } = useTranslation('property');
  const { t: tc } = useTranslation();
  const locale = useLocale();
  const { floor, totalFloors, features } = property;

  return (
    <Card className="gap-1 py-3">
      <Row icon="home" label={t('details.type')} value={tc(`propertyTypes.${property.propertyType}`)} />
      {property.buildingYear ? (
        <Row icon="calendar" label={t('details.buildingYear')} value={<Num className="font-sans-medium">{property.buildingYear}</Num>} />
      ) : null}
      {floor != null ? (
        <Row
          icon="floor"
          label={t('details.floor')}
          value={floor === 0 ? tc('groundFloor') : <Num className="font-sans-medium">{totalFloors ? `${floor}/${totalFloors}` : floor}</Num>}
        />
      ) : null}
      <Row icon="rooms" label={t('details.rooms')} value={<Num className="font-sans-medium">{formatNumber(property.rooms, locale)}</Num>} />
      <Row icon="size" label={t('details.size')} value={tc('sqmValue', { value: formatNumber(property.sizeSqm, locale) })} />
      <Row
        icon="parking"
        label={t('details.parking')}
        value={features.parking > 0 ? t('details.parkingSpots', { count: features.parking }) : tc('no')}
      />
      {property.gushHelka ? (
        <Row
          icon="mapPin"
          label={t('details.gushHelka')}
          value={<Num className="font-sans-medium">{`${property.gushHelka.gush} / ${property.gushHelka.helka}`}</Num>}
        />
      ) : null}

      <Separator className="my-3" />

      <View className="flex-row flex-wrap gap-2">
        {BOOLEAN_FEATURES.map((key) => (
          <View
            key={key}
            className={cn(
              'min-h-9 flex-row items-center gap-1.5 rounded-full px-3',
              features[key] ? 'bg-tone-aurora' : 'bg-muted opacity-60',
            )}
            accessibilityLabel={`${tc(`features.${key}`)}: ${features[key] ? tc('yes') : tc('no')}`}
          >
            <Icon name={features[key] ? 'check' : 'close'} size={14} className={features[key] ? 'text-score-high' : 'text-muted-foreground'} />
            <Text className="text-caption">{tc(`features.${key}`)}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}
