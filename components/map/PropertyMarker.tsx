import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Marker } from 'react-native-maps';

import { Num } from '@/components/common/Num';
import { glows } from '@/constants/theme';
import { scoreBand } from '@/lib/domain/score/grade';
import type { PropertySummary } from '@/lib/domain/types';
import { useLocale } from '@/lib/i18n/useLocale';
import { cn } from '@/lib/utils/cn';
import { formatCompactPrice, formatCurrency } from '@/lib/utils/format';

import { useTrackViewChanges } from './useTrackViewChanges';

const borderByBand = { high: 'border-score-high', mid: 'border-score-mid', low: 'border-score-low' } as const;
const dotByBand = { high: 'bg-score-high', mid: 'bg-score-mid', low: 'bg-score-low' } as const;

type PropertyMarkerProps = {
  property: PropertySummary;
  selected: boolean;
  onPress: (id: string) => void;
};

/** Price pill outlined in the property's score band; the selected one glows ion-blue (spec §4.2). */
export function PropertyMarker({ property, selected, onPress }: PropertyMarkerProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  const tracking = useTrackViewChanges(selected, locale);
  const band = property.scoreTotal != null ? scoreBand(property.scoreTotal) : null;

  return (
    <Marker
      identifier={property.id}
      coordinate={{ latitude: property.location.lat, longitude: property.location.lng }}
      tracksViewChanges={tracking}
      zIndex={selected ? 2 : 1}
      onPress={(e) => {
        e.stopPropagation();
        onPress(property.id);
      }}
      accessibilityLabel={[
        formatCurrency(property.price, locale),
        property.scoreTotal != null ? t('scoreLabel', { score: property.scoreTotal }) : null,
      ]
        .filter(Boolean)
        .join(', ')}
    >
      {/* Padding leaves room for the glow so the Android snapshot doesn't clip it. */}
      <View className="p-2">
        <View
          className={cn(
            'flex-row items-center gap-1.5 rounded-full border-2 px-2.5 py-1',
            selected ? 'border-primary bg-primary' : cn('bg-card', band ? borderByBand[band] : 'border-border'),
          )}
          style={selected ? { boxShadow: glows.primary } : undefined}
        >
          {band && !selected ? <View className={cn('h-2 w-2 rounded-full', dotByBand[band])} /> : null}
          <Num className={cn('font-sans-semibold text-caption', selected ? 'text-primary-foreground' : 'text-foreground')}>
            {formatCompactPrice(property.price, locale)}
          </Num>
        </View>
      </View>
    </Marker>
  );
}
