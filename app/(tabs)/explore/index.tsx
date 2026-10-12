import type BottomSheet from '@gorhom/bottom-sheet';
import { Link } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Num } from '@/components/common/Num';
import { ListingSheet, SHEET_PEEK_HEIGHT } from '@/components/map/ListingSheet';
import { MapSearchBar } from '@/components/map/MapSearchBar';
import { MiniPropertyCard } from '@/components/map/MiniPropertyCard';
import { PropertyMap, type PropertyMapHandle } from '@/components/map/PropertyMap';
import { Glass } from '@/components/ui/glass';
import { Icon } from '@/components/ui/icon';
import { usePropertiesInBbox } from '@/lib/api/queries';
import { activeFilterCount, sortProperties } from '@/lib/domain/filters';
import { regionAround, regionToBbox } from '@/lib/map/region';
import { useNearMe } from '@/lib/map/useNearMe';
import { usePalette } from '@/lib/usePalette';
import { useMapStore } from '@/stores/map';

const TOP_BAR_HEIGHT = 56;

/**
 * Explore (spec §4.2): full-screen map with clustered price markers, floating glass
 * search / filter / near-me controls, a mini card for the tapped marker and the
 * listing sheet. The only screen without a native header.
 */
export default function ExploreScreen() {
  const { t } = useTranslation('explore');
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  const mapRef = React.useRef<PropertyMapHandle>(null);
  const sheetRef = React.useRef<BottomSheet>(null);

  const region = useMapStore((s) => s.region);
  const filters = useMapStore((s) => s.filters);
  const sort = useMapStore((s) => s.sort);
  const selectedId = useMapStore((s) => s.selectedId);
  const { setRegion, setSort, select, resetFilters } = useMapStore.getState();

  // Captured once: the map is uncontrolled after mount and reports moves back to the store.
  const [initialRegion] = React.useState(region);

  const query = usePropertiesInBbox(regionToBbox(region), filters);
  const properties = sortProperties(query.data ?? [], sort);
  const selected = properties.find((p) => p.id === selectedId);
  const filterCount = activeFilterCount(filters);

  const nearMe = useNearMe((position) => mapRef.current?.animateTo(regionAround(position)));

  // iOS tab bars float over content and expo-router's per-tab SafeAreaProvider includes
  // them in the bottom inset; on Android the content already ends above the tab bar.
  const bottomInset = Platform.OS === 'ios' ? insets.bottom : 0;
  const topBarBottom = insets.top + 8 + TOP_BAR_HEIGHT;

  const handleSelect = (id: string | null) => {
    select(id);
    if (id) sheetRef.current?.snapToIndex(0);
  };

  return (
    <View className="flex-1 bg-background">
      <PropertyMap
        ref={mapRef}
        properties={properties}
        initialRegion={initialRegion}
        selectedId={selectedId}
        onSelect={handleSelect}
        onRegionChange={setRegion}
        showsUserLocation={nearMe.granted}
        padding={{ top: topBarBottom, bottom: SHEET_PEEK_HEIGHT + bottomInset }}
      />

      <View className="absolute start-4 end-4 flex-row items-start gap-3" style={{ top: insets.top + 8 }}>
        <MapSearchBar
          onSelectPlace={(place) => mapRef.current?.animateTo(regionAround(place.center, place.kind === 'city' ? 0.06 : 0.02))}
        />
        <View className="gap-3">
          <Glass interactive className="h-14 w-14 rounded-full">
            <Link href="/filters" asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={filterCount ? t('filtersActive', { count: filterCount }) : t('filters')}
                className="flex-1 items-center justify-center"
              >
                <Icon name="filters" size={20} className={filterCount ? 'text-primary' : 'text-foreground'} />
              </Pressable>
            </Link>
          </Glass>
          {filterCount ? (
            <View
              pointerEvents="none"
              className="absolute -end-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1"
            >
              <Num className="font-sans-bold text-[11px] leading-4 text-primary-foreground">{filterCount}</Num>
            </View>
          ) : null}
          <Glass interactive className="h-14 w-14 rounded-full">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('nearMe')}
              accessibilityState={{ busy: nearMe.locating }}
              className="flex-1 items-center justify-center"
              onPress={nearMe.locate}
            >
              {nearMe.locating ? (
                <ActivityIndicator color={palette.primary} />
              ) : (
                <Icon name="location" size={20} className="text-primary" />
              )}
            </Pressable>
          </Glass>
        </View>
      </View>

      {selected ? (
        <View className="absolute start-4 end-4" style={{ bottom: SHEET_PEEK_HEIGHT + bottomInset + 12 }}>
          <MiniPropertyCard property={selected} onClose={() => select(null)} />
        </View>
      ) : null}

      <ListingSheet
        ref={sheetRef}
        properties={properties}
        loading={query.isFetching}
        error={query.isError}
        onRetry={() => query.refetch()}
        sort={sort}
        onSortChange={setSort}
        hasFilters={filterCount > 0}
        onClearFilters={resetFilters}
        bottomInset={bottomInset}
        topInset={insets.top}
      />
    </View>
  );
}
