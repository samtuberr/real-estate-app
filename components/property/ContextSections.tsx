import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Num } from '@/components/common/Num';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import type { CityPlan, PropertyDetail } from '@/lib/domain/types';
import { useLocale } from '@/lib/i18n/useLocale';
import { useLocalized } from '@/lib/i18n/useLocalized';
import { formatDate, formatNumber } from '@/lib/utils/format';

export function PlanDetails({ plan }: { plan: CityPlan }) {
  const { t } = useTranslation('property');
  const localized = useLocalized();
  const locale = useLocale();
  return (
    <View className="gap-2">
      <Text variant="label">{localized(plan.name)}</Text>
      <View className="flex-row flex-wrap items-center gap-2">
        <Badge variant="secondary">
          <Text>{t(`plans.status.${plan.status}`)}</Text>
        </Badge>
        <Text variant="caption">{t(`plans.type.${plan.type}`)}</Text>
        <Num className="text-caption text-muted-foreground">
          {t('context.distance', { value: formatNumber(plan.distanceMeters, locale) })}
        </Num>
      </View>
      <Text variant="muted">{localized(plan.impact)}</Text>
      <Num className="text-caption text-muted-foreground">{plan.planNumber}</Num>
      {plan.approvedAt ? (
        <Text variant="caption">{t('plans.approvedAt', { date: formatDate(plan.approvedAt, locale) })}</Text>
      ) : null}
    </View>
  );
}

export function PlansSection({ property }: { property: PropertyDetail }) {
  const { t } = useTranslation('property');
  return (
    <View className="gap-3">
      <SectionHeader title={t('plans.title')} />
      <Card className="gap-5">
        <Text variant="caption">{t('plans.radius')}</Text>
        {property.plans === undefined ? (
          <Text variant="muted">{t('context.unavailable')}</Text>
        ) : property.plans.length === 0 ? (
          <Text variant="muted">{t('plans.empty')}</Text>
        ) : (
          <>
            {property.plans.slice(0, 2).map((plan) => (
              <PlanDetails key={plan.id} plan={plan} />
            ))}
            <Button
              variant="secondary"
              onPress={() => router.push({ pathname: '/property/[id]/plans', params: { id: property.id } })}
            >
              <Text>{t('plans.viewAll')}</Text>
            </Button>
          </>
        )}
      </Card>
    </View>
  );
}

export function AmenitiesSection({ property }: { property: PropertyDetail }) {
  const { t } = useTranslation('property');
  const locale = useLocale();
  const localized = useLocalized();
  return (
    <View className="gap-3">
      <SectionHeader title={t('amenities.title')} />
      <Card className="gap-4">
        <Text variant="caption">{t('amenities.radius')}</Text>
        {property.amenities === undefined ? (
          <Text variant="muted">{t('context.unavailable')}</Text>
        ) : (
          property.amenities.map((group) => (
            <View key={group.category} className="gap-1">
              <View className="flex-row items-center justify-between gap-3">
                <Text>{t(`amenities.categories.${group.category}`)}</Text>
                <Num className="font-sans-semibold">{formatNumber(group.count, locale)}</Num>
              </View>
              <Text variant="caption">
                {group.count > 0 && group.nearest
                  ? t('amenities.nearest', {
                      name: localized(group.nearest.name),
                      distance: formatNumber(group.nearest.distanceMeters, locale),
                    })
                  : t('amenities.none')}
              </Text>
            </View>
          ))
        )}
      </Card>
    </View>
  );
}

export function TrafficSection({ property }: { property: PropertyDetail }) {
  const { t } = useTranslation('property');
  const locale = useLocale();
  const localized = useLocalized();
  const traffic = property.traffic;
  return (
    <View className="gap-3">
      <SectionHeader title={t('traffic.title')} />
      <Card className="gap-4">
        {!traffic ? (
          <Text variant="muted">{t('context.unavailable')}</Text>
        ) : (
          <>
            <View className="flex-row flex-wrap justify-between gap-3">
              <View className="gap-1">
                <Text variant="caption">{t('traffic.congestion')}</Text>
                <Text variant="label">{t(`traffic.level.${traffic.congestion}`)}</Text>
              </View>
              <View className="gap-1">
                <Text variant="caption">{t('traffic.noise')}</Text>
                <Text variant="label">{t(`traffic.level.${traffic.noise}`)}</Text>
              </View>
            </View>
            <Separator />
            {(['bus', 'train', 'light_rail'] as const).map((kind) => {
              const stop = traffic.stops
                .filter((s) => s.kind === kind)
                .sort((a, b) => a.distanceMeters - b.distanceMeters)[0];
              return (
                <View key={kind} className="gap-1">
                  <Text variant="label">{t(`traffic.stops.${kind}`)}</Text>
                  <Text variant="caption">
                    {stop
                      ? t('amenities.nearest', {
                          name: localized(stop.name),
                          distance: formatNumber(stop.distanceMeters, locale),
                        })
                      : t('traffic.noStop')}
                  </Text>
                </View>
              );
            })}
            <Text variant="muted">
              {t('traffic.highway', { distance: formatNumber(traffic.highwayDistanceMeters, locale) })}
            </Text>
            <Text variant="caption">{t('context.straightLine')}</Text>
          </>
        )}
      </Card>
    </View>
  );
}
