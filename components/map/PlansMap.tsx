import { useColorScheme } from 'nativewind';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';
import { darkMapStyle } from '@/constants/mapStyle';
import type { CityPlan, LatLng } from '@/lib/domain/types';
import { useLocalized } from '@/lib/i18n/useLocalized';
import { usePalette } from '@/lib/usePalette';

export type PlansMapProps = {
  location: LatLng;
  plans: CityPlan[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};
export function PlansMap({ location, plans, selectedId, onSelect }: PlansMapProps) {
  const palette = usePalette();
  const { colorScheme } = useColorScheme();
  const localized = useLocalized();
  const { t } = useTranslation('property');
  const ref = useRef<MapView>(null);
  const ready = useRef(false);
  const fit = () => {
    if (!ready.current) return;
    const visible = selectedId ? plans.filter((p) => p.id === selectedId) : plans;
    ref.current?.fitToCoordinates(
      [
        { latitude: location.lat, longitude: location.lng },
        ...visible.flatMap((p) =>
          (p.geometry.coordinates[0] ?? []).map(([longitude, latitude]) => ({ longitude, latitude })),
        ),
      ],
      { edgePadding: { top: 35, bottom: 35, left: 35, right: 35 }, animated: false },
    );
  };
  useEffect(fit, [selectedId, plans, location]);
  return (
    <MapView
      ref={ref}
      style={{ flex: 1 }}
      initialRegion={{ latitude: location.lat, longitude: location.lng, latitudeDelta: 0.016, longitudeDelta: 0.016 }}
      onMapReady={() => {
        ready.current = true;
        fit();
      }}
      onLayout={fit}
      userInterfaceStyle={colorScheme === 'dark' ? 'dark' : 'light'}
      customMapStyle={Platform.OS === 'android' && colorScheme === 'dark' ? darkMapStyle : undefined}
      toolbarEnabled={false}
      rotateEnabled={false}
    >
      <Marker
        coordinate={{ latitude: location.lat, longitude: location.lng }}
        title={t('plans.home')}
        pinColor={palette.plasma}
      />
      {plans.map((plan) => (
        <Polygon
          key={plan.id}
          tappable
          onPress={() => onSelect(plan.id)}
          coordinates={(plan.geometry.coordinates[0] ?? []).map(([longitude, latitude]) => ({ latitude, longitude }))}
          holes={plan.geometry.coordinates
            .slice(1)
            .map((ring) => ring.map(([longitude, latitude]) => ({ latitude, longitude })))}
          strokeColor={plan.id === selectedId ? palette.plasma : palette.primary}
          strokeWidth={plan.id === selectedId ? 3 : 2}
          fillColor={`${plan.id === selectedId ? palette.plasma : palette.primary}33`}
          accessibilityLabel={localized(plan.name)}
        />
      ))}
    </MapView>
  );
}
