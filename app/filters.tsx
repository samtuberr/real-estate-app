import { Host, Slider, Switch } from '@expo/ui';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Money } from '@/components/common/Money';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { usePropertiesInBbox } from '@/lib/api/queries';
import { activeFilterCount } from '@/lib/domain/filters';
import { type FeatureKey, PROPERTY_TYPES, type PropertyType } from '@/lib/domain/types';
import { regionToBbox } from '@/lib/map/region';
import { usePalette } from '@/lib/usePalette';
import { useMapStore } from '@/stores/map';

const PRICE_STEP = 250_000;
const PRICE_MAX = 10_000_000;
const SIZE_MAX = 200;
const ROOM_OPTIONS = [2, 3, 4, 5];
const SCORE_OPTIONS = [50, 65, 80];
const FEATURES: FeatureKey[] = ['parking', 'elevator', 'mamad', 'balcony'];

function Section({ title, value, children }: { title: string; value?: React.ReactNode; children: React.ReactNode }) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between gap-4">
        <Text role="heading" variant="label">
          {title}
        </Text>
        {value}
      </View>
      {children}
    </View>
  );
}

function PriceRow({ label, value, anyLabel }: { label: string; value: number | undefined; anyLabel: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text variant="muted">{label}</Text>
      {value ? <Money value={value} className="font-sans-semibold" /> : <Text className="font-sans-semibold">{anyLabel}</Text>}
    </View>
  );
}

function toggle<T>(list: readonly T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

/**
 * Map filters (spec §4.2) as a native form sheet. Changes apply live to the map
 * store, so the button shows how many homes in the current view match. The title
 * row lives in the content because native stack headers aren't supported inside
 * iOS form sheets with detents.
 */
export default function FiltersScreen() {
  const { t } = useTranslation('filters');
  const { t: tc } = useTranslation();
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  const { colorScheme } = useColorScheme();
  const region = useMapStore((s) => s.region);
  const filters = useMapStore((s) => s.filters);
  const { setFilters, resetFilters } = useMapStore.getState();
  const { data } = usePropertiesInBbox(regionToBbox(region), filters);
  const count = data?.length ?? 0;

  const hostProps = { colorScheme, seedColor: palette.primary } as const;

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-5 pb-2 pt-6">
        <Text role="heading" variant="h1">
          {t('title')}
        </Text>
        <Button variant="ghost" size="sm" disabled={activeFilterCount(filters) === 0} onPress={resetFilters}>
          <Text className="text-primary">{t('reset')}</Text>
        </Button>
      </View>

      <ScrollView contentContainerClassName="gap-7 px-5 pb-6 pt-4" showsVerticalScrollIndicator={false}>
        <Section title={t('price')}>
          <Card className="gap-3 p-4">
            <PriceRow label={t('priceFrom')} value={filters.priceMin} anyLabel={t('any')} />
            <Host {...hostProps} matchContents={{ vertical: true }} style={{ width: '100%' }}>
              <Slider
                value={filters.priceMin ?? 0}
                min={0}
                max={PRICE_MAX - PRICE_STEP}
                step={PRICE_STEP}
                onValueChange={(v) => {
                  const priceMin = v > 0 ? v : undefined;
                  // Keep the range valid: dragging "from" past "up to" pushes "up to" along.
                  const priceMax = priceMin && filters.priceMax && filters.priceMax < priceMin ? priceMin : filters.priceMax;
                  setFilters({ priceMin, priceMax });
                }}
              />
            </Host>
            <Separator />
            <PriceRow label={t('priceTo')} value={filters.priceMax} anyLabel={t('any')} />
            <Host {...hostProps} matchContents={{ vertical: true }} style={{ width: '100%' }}>
              <Slider
                value={filters.priceMax ?? PRICE_MAX}
                min={PRICE_STEP * 4}
                max={PRICE_MAX}
                step={PRICE_STEP}
                onValueChange={(v) => {
                  const priceMax = v < PRICE_MAX ? v : undefined;
                  const priceMin = priceMax && filters.priceMin && filters.priceMin > priceMax ? priceMax : filters.priceMin;
                  setFilters({ priceMin, priceMax });
                }}
              />
            </Host>
          </Card>
        </Section>

        <Section title={t('rooms')}>
          <View className="flex-row flex-wrap gap-2">
            <Chip label={t('any')} selected={filters.roomsMin == null} onPress={() => setFilters({ roomsMin: undefined })} />
            {ROOM_OPTIONS.map((n) => (
              <Chip
                key={n}
                label={t('roomsMin', { value: n })}
                selected={filters.roomsMin === n}
                onPress={() => setFilters({ roomsMin: n })}
              />
            ))}
          </View>
        </Section>

        <Section
          title={t('size')}
          value={
            filters.sizeMin ? (
              <Text className="font-sans-semibold">{t('sizeMin', { value: filters.sizeMin })}</Text>
            ) : (
              <Text variant="muted">{t('any')}</Text>
            )
          }
        >
          <Host {...hostProps} matchContents={{ vertical: true }} style={{ width: '100%' }}>
            <Slider
              value={filters.sizeMin ?? 0}
              min={0}
              max={SIZE_MAX}
              step={10}
              onValueChange={(v) => setFilters({ sizeMin: v > 0 ? v : undefined })}
            />
          </Host>
        </Section>

        <Section title={t('type')}>
          <View className="flex-row flex-wrap gap-2">
            {PROPERTY_TYPES.map((type: PropertyType) => (
              <Chip
                key={type}
                label={tc(`propertyTypes.${type}`)}
                selected={filters.propertyTypes.includes(type)}
                onPress={() => setFilters({ propertyTypes: toggle(filters.propertyTypes, type) })}
              />
            ))}
          </View>
        </Section>

        <Section title={t('minScore')}>
          <View className="flex-row flex-wrap gap-2">
            <Chip label={t('any')} selected={filters.minScore == null} onPress={() => setFilters({ minScore: undefined })} />
            {SCORE_OPTIONS.map((n) => (
              <Chip
                key={n}
                label={`${n}+`}
                selected={filters.minScore === n}
                onPress={() => setFilters({ minScore: n })}
              />
            ))}
          </View>
        </Section>

        <Section title={t('features')}>
          <Card className="gap-1 py-2">
            {FEATURES.map((feature) => (
              <Host key={feature} {...hostProps} matchContents={{ vertical: true }} style={{ width: '100%', minHeight: 44 }}>
                <Switch
                  label={tc(`features.${feature}`)}
                  value={filters.features.includes(feature)}
                  onValueChange={() => setFilters({ features: toggle(filters.features, feature) })}
                />
              </Host>
            ))}
          </Card>
        </Section>

        <Card className="gap-1 py-3">
          {/* Needs the buyer profile (M1) for the affordability calculation. */}
          <Host {...hostProps} matchContents={{ vertical: true }} style={{ width: '100%', minHeight: 44 }}>
            <Switch label={t('withinBudget')} value={false} disabled onValueChange={() => {}} />
          </Host>
          <Text variant="caption">{t('withinBudgetHint')}</Text>
        </Card>
      </ScrollView>

      <View className="border-t border-border px-5 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <Button size="lg" onPress={() => router.back()}>
          <Text>{t('showResults', { count })}</Text>
        </Button>
      </View>
    </View>
  );
}
