import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Marker } from 'react-native-maps';

import { Num } from '@/components/common/Num';
import { glows } from '@/constants/theme';

import { useTrackViewChanges } from './useTrackViewChanges';

type ClusterMarkerProps = {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  onPress: () => void;
};

/** Glowing ion bubble with the number of homes it groups. Tapping zooms in to split it. */
export function ClusterMarker({ id, latitude, longitude, count, onPress }: ClusterMarkerProps) {
  const { t } = useTranslation('explore');
  const tracking = useTrackViewChanges(count);
  const size = count < 10 ? 40 : count < 50 ? 48 : 56;

  return (
    <Marker
      identifier={id}
      coordinate={{ latitude, longitude }}
      tracksViewChanges={tracking}
      onPress={(e) => {
        e.stopPropagation();
        onPress();
      }}
      accessibilityLabel={t('clusterLabel', { count })}
    >
      <View className="p-3">
        <View
          className="items-center justify-center rounded-full border-2 border-plasma/70 bg-primary"
          style={{ width: size, height: size, boxShadow: glows.primary }}
        >
          <Num className="font-sans-bold text-body text-primary-foreground">{count}</Num>
        </View>
      </View>
    </Marker>
  );
}
