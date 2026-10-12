import BottomSheet, { type BottomSheetBackgroundProps, useBottomSheetScrollableCreator } from '@gorhom/bottom-sheet';
import { useFocusEffect } from 'expo-router';
import * as React from 'react';
import type { EffectCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { FlashList } from '@/components/ui/flash-list';
import { Glass } from '@/components/ui/glass';
import { Text } from '@/components/ui/text';
import { SORT_KEYS, type PropertySummary, type SortKey } from '@/lib/domain/types';
import { usePalette } from '@/lib/usePalette';

/** Height of the peek detent above the bottom inset: handle + count + sort chips. */
export const SHEET_PEEK_HEIGHT = 124;

type ListingSheetProps = {
  ref?: React.Ref<BottomSheet>;
  properties: readonly PropertySummary[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  sort: SortKey;
  onSortChange: (sort: SortKey) => void;
  hasFilters: boolean;
  onClearFilters: () => void;
  /** Space taken by the tab bar / home indicator at the bottom of the screen. */
  bottomInset: number;
  topInset: number;
};

/** Lets the sheet find its scrollable again when the tab regains focus. */
function useSheetFocus(effect: EffectCallback) {
  useFocusEffect(effect);
}

function SheetBackground({ style }: BottomSheetBackgroundProps) {
  return <Glass className="rounded-t-3xl" style={style} />;
}

/**
 * Listing sheet over the map (spec §4.2) with three detents: peek (count + sort),
 * half and full (FlashList of PropertyCard).
 *
 * Uses @gorhom/bottom-sheet v5 rather than `@expo/ui` BottomSheet: the native sheet
 * is presented modally (over the tab bar on iOS, with a touch-blocking scrim on
 * Android), so it can't stay docked while the user pans the map. This is the
 * fallback spec §4.2 allows.
 */
export function ListingSheet({
  ref,
  properties,
  loading,
  error,
  onRetry,
  sort,
  onSortChange,
  hasFilters,
  onClearFilters,
  bottomInset,
  topInset,
}: ListingSheetProps) {
  const { t } = useTranslation('explore');
  const { t: tc } = useTranslation();
  const palette = usePalette();
  const renderScrollComponent = useBottomSheetScrollableCreator({ focusHook: useSheetFocus });

  return (
    <BottomSheet
      ref={ref}
      index={0}
      snapPoints={[SHEET_PEEK_HEIGHT + bottomInset, '50%', '100%']}
      topInset={topInset}
      enableDynamicSizing={false}
      backgroundComponent={SheetBackground}
      handleIndicatorStyle={{ backgroundColor: palette.mutedForeground, width: 40 }}
    >
      <View className="gap-3 pb-3">
        <View className="flex-row items-center gap-2 px-5">
          <Text role="heading" variant="h2" className="flex-1">
            {t('homesInView', { count: properties.length })}
          </Text>
          {loading ? <ActivityIndicator color={palette.primary} /> : null}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 px-5"
          accessibilityLabel={t('sortBy')}
        >
          {SORT_KEYS.map((key) => (
            <Chip key={key} label={t(`sort.${key}`)} selected={sort === key} onPress={() => onSortChange(key)} />
          ))}
        </ScrollView>
      </View>

      <FlashList
        data={properties}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PropertyCard property={item} className="mx-4 mb-4" />}
        renderScrollComponent={renderScrollComponent}
        contentContainerStyle={{ paddingBottom: bottomInset + 16 }}
        ListEmptyComponent={
          loading ? null : error ? (
            <EmptyState
              icon="info"
              title={tc('error')}
              className="mx-4"
              action={
                <Button variant="secondary" size="sm" className="mt-2" onPress={onRetry}>
                  <Text>{tc('retry')}</Text>
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon="mapOff"
              title={t('noResultsTitle')}
              body={t('noResultsBody')}
              className="mx-4"
              action={
                hasFilters ? (
                  <Button variant="secondary" size="sm" className="mt-2" onPress={onClearFilters}>
                    <Text>{t('clearFilters')}</Text>
                  </Button>
                ) : null
              }
            />
          )
        }
      />
    </BottomSheet>
  );
}
