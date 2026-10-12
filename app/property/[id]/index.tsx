import { router, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, Share, View } from 'react-native';

import { Disclaimer } from '@/components/common/Disclaimer';
import { EmptyState } from '@/components/common/EmptyState';
import { Money } from '@/components/common/Money';
import { SectionHeader } from '@/components/common/SectionHeader';
import { StickyCTA } from '@/components/common/StickyCTA';
import { MarketCard } from '@/components/property/MarketCard';
import { PhotoCarousel } from '@/components/property/PhotoCarousel';
import { PropertyDetailsCard } from '@/components/property/PropertyDetailsCard';
import { PropertySpecs } from '@/components/property/PropertySpecs';
import { SaveButton } from '@/components/property/SaveButton';
import { ScoreSummaryCard } from '@/components/property/ScoreSummaryCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Glass } from '@/components/ui/glass';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useProperty } from '@/lib/api/queries';
import { pricePerSqm } from '@/lib/domain/filters';
import { useLocale } from '@/lib/i18n/useLocale';
import { useLocalized } from '@/lib/i18n/useLocalized';
import { usePalette } from '@/lib/usePalette';
import { formatArea, formatStreet } from '@/lib/utils/address';
import { formatCurrency } from '@/lib/utils/format';

const GALLERY_HEIGHT = 340;
const CTA_SPACE = 112;

/**
 * Listing page (spec §4.3). M2 covers photos, header, score summary, details, market
 * and the CTA. M3 adds city plans, amenities and traffic; M4 fills the mortgage card;
 * M6 wires the consultation CTA. Reachable by deep link (`nadlanscore://property/<id>`).
 */
export default function PropertyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation('property');
  const { t: tc } = useTranslation();
  const locale = useLocale();
  const localized = useLocalized();
  const palette = usePalette();
  const { data: property, isPending, isError, refetch } = useProperty(id);

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  if (isError || !property) {
    return (
      <View className="flex-1 justify-center bg-background px-5">
        <EmptyState
          icon={isError ? 'info' : 'mapOff'}
          title={isError ? tc('error') : t('notFoundTitle')}
          body={isError ? undefined : t('notFoundBody')}
          action={
            <Button
              variant="secondary"
              size="sm"
              className="mt-2"
              onPress={() => (isError ? refetch() : router.canGoBack() ? router.back() : router.replace('/explore'))}
            >
              <Text>{isError ? tc('retry') : tc('notFound.action')}</Text>
            </Button>
          }
        />
      </View>
    );
  }

  const street = formatStreet(property.address, locale);
  const share = () =>
    Share.share({
      message: t('shareMessage', {
        address: `${street}, ${localized(property.address.city)}`,
        price: formatCurrency(property.price, locale),
      }),
    });

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: CTA_SPACE }}
      >
        <PhotoCarousel propertyId={property.id} images={property.images} height={GALLERY_HEIGHT} />

        <View className="gap-8 px-5 pt-5">
          <View className="gap-2">
            <View className="flex-row items-start gap-3">
              <View className="flex-1 gap-1">
                {property.status !== 'active' ? (
                  <Badge variant="secondary">
                    <Text>{property.status === 'sold' ? t('sold') : t('offMarket')}</Text>
                  </Badge>
                ) : null}
                <Money value={property.price} className="font-sans-bold text-display" />
                <Text variant="h2" role="heading">
                  {street}
                </Text>
                <Text variant="muted">{formatArea(property.address, locale)}</Text>
              </View>
              <View className="flex-row gap-2">
                <Glass interactive className="h-11 w-11 rounded-full">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={tc('share')}
                    className="flex-1 items-center justify-center"
                    onPress={share}
                  >
                    <Icon name="share" size={18} />
                  </Pressable>
                </Glass>
                <SaveButton id={property.id} />
              </View>
            </View>
            <PropertySpecs property={property} />
            <Text variant="caption">{t('pricePerSqm', { value: formatCurrency(pricePerSqm(property), locale) })}</Text>
          </View>

          <View className="gap-3">
            <SectionHeader title={t('score.title')} />
            <ScoreSummaryCard score={property.score} />
          </View>

          <View className="gap-3">
            <SectionHeader title={t('about')} />
            <Text>{localized(property.description)}</Text>
          </View>

          <View className="gap-3">
            <SectionHeader title={t('details.title')} />
            <PropertyDetailsCard property={property} />
          </View>

          <View className="gap-3">
            <SectionHeader title={t('market.title')} />
            <MarketCard property={property} />
          </View>

          <Card tone="solar" className="gap-2">
            <Text role="heading" variant="h2">
              {t('mortgage.title')}
            </Text>
            <Text variant="muted">{t('mortgage.body')}</Text>
          </Card>

          <Disclaimer />
        </View>
      </ScrollView>

      <StickyCTA>
        <Button size="lg" onPress={() => Alert.alert(t('cta'), t('ctaSoon'))}>
          <Icon name="chat" size={18} className="text-primary-foreground" />
          <Text>{t('cta')}</Text>
        </Button>
      </StickyCTA>
    </View>
  );
}
