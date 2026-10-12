import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, View } from 'react-native';

import { Glass } from '@/components/ui/glass';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { usePlaceSearch } from '@/lib/api/queries';
import type { Place } from '@/lib/domain/types';
import { useLocalized } from '@/lib/i18n/useLocalized';
import { usePalette } from '@/lib/usePalette';

type MapSearchBarProps = { onSelectPlace: (place: Place) => void };

/** Floating glass search pill (spec §4.2) with city / neighborhood suggestions. */
export function MapSearchBar({ onSelectPlace }: MapSearchBarProps) {
  const { t } = useTranslation('explore');
  const localized = useLocalized();
  const palette = usePalette();
  const [query, setQuery] = React.useState('');
  const [focused, setFocused] = React.useState(false);
  const { data: places = [], isFetching } = usePlaceSearch(query);
  const showSuggestions = focused && query.trim().length > 0;

  const select = (place: Place) => {
    setQuery(localized(place.name));
    setFocused(false);
    onSelectPlace(place);
  };

  return (
    <View className="flex-1">
      <Glass className="h-14 flex-row items-center gap-3 rounded-full ps-5 pe-2">
        <Icon name="search" size={18} className="text-muted-foreground" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={() => places[0] && select(places[0])}
          placeholder={t('searchPlaceholder')}
          placeholderTextColor={palette.mutedForeground}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel={t('searchPlaceholder')}
          className="h-full flex-1 font-sans text-body text-foreground"
        />
        {query ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('clearSearch')}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center"
            onPress={() => setQuery('')}
          >
            <Icon name="closeCircle" size={18} className="text-muted-foreground" />
          </Pressable>
        ) : null}
      </Glass>

      {showSuggestions ? (
        <Glass className="mt-2 rounded-3xl py-2">
          {places.length === 0 && !isFetching ? (
            <Text variant="muted" className="px-5 py-3">
              {t('searchNoResults')}
            </Text>
          ) : (
            places.map((place) => (
              <Pressable
                key={place.id}
                accessibilityRole="button"
                className="min-h-12 flex-row items-center gap-3 px-5 py-2 active:bg-foreground/5"
                onPress={() => select(place)}
              >
                <Icon name={place.kind === 'city' ? 'floor' : 'mapPin'} size={18} className="text-primary" />
                <View className="flex-1">
                  <Text numberOfLines={1}>{localized(place.name)}</Text>
                  {place.city ? (
                    <Text variant="caption" numberOfLines={1}>
                      {localized(place.city)}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ))
          )}
        </Glass>
      ) : null}
    </View>
  );
}
