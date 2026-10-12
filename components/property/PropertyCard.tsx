import { Link } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Money } from '@/components/common/Money';
import { PropertySpecs } from '@/components/property/PropertySpecs';
import { SaveButton } from '@/components/property/SaveButton';
import { ScoreBadge } from '@/components/property/ScoreBadge';
import { Badge } from '@/components/ui/badge';
import { Image } from '@/components/ui/image';
import { Text } from '@/components/ui/text';
import { isNewListing } from '@/lib/domain/filters';
import type { PropertySummary } from '@/lib/domain/types';
import { useLocale } from '@/lib/i18n/useLocale';
import { formatArea, formatStreet } from '@/lib/utils/address';
import { cn } from '@/lib/utils/cn';

type PropertyCardProps = { property: PropertySummary; className?: string };

/** Listing card (spec §7): photo on top, big price, specs, score badge. Opens the listing page. */
export function PropertyCard({ property, className }: PropertyCardProps) {
  const { t } = useTranslation();
  const { t: tp } = useTranslation('property');
  const locale = useLocale();
  const inactive = property.status !== 'active';

  return (
    <Link href={`/property/${property.id}`} asChild>
      <Pressable
        accessibilityRole="button"
        className={cn('gap-3 rounded-3xl bg-card p-3 active:opacity-90', className)}
        style={{ borderCurve: 'continuous' }}
      >
        <View>
          <Image
            source={property.thumbnail?.url}
            placeholder={property.thumbnail?.blurhash ? { blurhash: property.thumbnail.blurhash } : undefined}
            contentFit="cover"
            transition={200}
            className={cn('aspect-[16/10] w-full rounded-2xl bg-muted', inactive && 'opacity-50')}
            accessibilityIgnoresInvertColors
          />
          <View className="absolute start-3 top-3 flex-row gap-2">
            {inactive ? (
              <Badge variant="secondary">
                <Text>{property.status === 'sold' ? tp('sold') : tp('offMarket')}</Text>
              </Badge>
            ) : isNewListing(property.createdAt, new Date()) ? (
              <Badge>
                <Text>{t('new')}</Text>
              </Badge>
            ) : null}
          </View>
          <SaveButton id={property.id} className="absolute end-3 top-3" />
        </View>

        <View className="flex-row items-start gap-3 px-1 pb-1">
          <View className="flex-1 gap-0.5">
            <Money value={property.price} className="font-sans-bold text-h2" />
            <Text numberOfLines={1}>{formatStreet(property.address, locale)}</Text>
            <Text variant="caption" numberOfLines={1}>
              {formatArea(property.address, locale)}
            </Text>
            <PropertySpecs property={property} className="mt-1 text-caption" />
          </View>
          <ScoreBadge score={property.scoreTotal} size="md" />
        </View>
      </Pressable>
    </Link>
  );
}
