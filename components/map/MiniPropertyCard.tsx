import { Link } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Money } from '@/components/common/Money';
import { PropertySpecs } from '@/components/property/PropertySpecs';
import { ScoreBadge } from '@/components/property/ScoreBadge';
import { Glass } from '@/components/ui/glass';
import { Icon } from '@/components/ui/icon';
import { Image } from '@/components/ui/image';
import { Text } from '@/components/ui/text';
import type { PropertySummary } from '@/lib/domain/types';
import { useLocale } from '@/lib/i18n/useLocale';
import { formatStreet } from '@/lib/utils/address';

type MiniPropertyCardProps = { property: PropertySummary; onClose: () => void };

/** Glass card that floats above the sheet when a marker is tapped (spec §4.2). Tap opens the listing. */
export function MiniPropertyCard({ property, onClose }: MiniPropertyCardProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  return (
    <Glass interactive className="rounded-3xl">
      <View className="flex-row items-center">
        <Link href={`/property/${property.id}`} asChild>
          <Pressable accessibilityRole="button" className="flex-1 flex-row items-center gap-3 p-3 active:opacity-80">
            <Image
              source={property.thumbnail?.url}
              placeholder={property.thumbnail?.blurhash ? { blurhash: property.thumbnail.blurhash } : undefined}
              contentFit="cover"
              transition={150}
              className="h-20 w-20 rounded-2xl bg-muted"
              accessibilityIgnoresInvertColors
            />
            <View className="flex-1 gap-0.5">
              <Money value={property.price} className="font-sans-bold text-h2" />
              <Text numberOfLines={1}>{formatStreet(property.address, locale)}</Text>
              <PropertySpecs property={property} className="text-caption" />
            </View>
            <ScoreBadge score={property.scoreTotal} size="md" />
          </Pressable>
        </Link>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('close')}
          hitSlop={6}
          className="h-11 w-11 items-center justify-center self-start"
          onPress={onClose}
        >
          <Icon name="close" size={16} className="text-muted-foreground" />
        </Pressable>
      </View>
    </Glass>
  );
}
