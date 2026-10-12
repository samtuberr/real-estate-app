import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Platform } from 'react-native';
import MapView from 'react-native-maps';

import { darkMapStyle } from '@/constants/mapStyle';
import type { PropertySummary } from '@/lib/domain/types';
import { createClusterIndex, getMapItems, regionForZoom } from '@/lib/map/cluster';
import type { MapRegion } from '@/lib/map/region';
import { usePalette } from '@/lib/usePalette';

import { ClusterMarker } from './ClusterMarker';
import { PropertyMarker } from './PropertyMarker';

export type PropertyMapHandle = { animateTo: (region: MapRegion) => void };

export type PropertyMapProps = {
  ref?: React.Ref<PropertyMapHandle>;
  properties: readonly PropertySummary[];
  initialRegion: MapRegion;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRegionChange: (region: MapRegion) => void;
  showsUserLocation?: boolean;
  /** Keeps the legal label and centring clear of the floating controls and the sheet. */
  padding: { top: number; bottom: number };
};

/**
 * Full-screen map (spec §4.2): Apple Maps on iOS, Google Maps on Android, markers
 * clustered with supercluster. Needs a development build — see PropertyMap.web.tsx
 * for the web preview.
 */
export function PropertyMap({
  ref,
  properties,
  initialRegion,
  selectedId,
  onSelect,
  onRegionChange,
  showsUserLocation = false,
  padding,
}: PropertyMapProps) {
  const mapRef = React.useRef<MapView>(null);
  const [region, setRegion] = React.useState(initialRegion);
  const { colorScheme } = useColorScheme();
  const palette = usePalette();
  const dark = colorScheme === 'dark';

  React.useImperativeHandle(ref, () => ({
    animateTo: (next) => mapRef.current?.animateToRegion(next, 450),
  }));

  const clusterIndex = createClusterIndex(properties);
  const items = getMapItems(clusterIndex, region);

  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      initialRegion={initialRegion}
      onRegionChangeComplete={(next) => {
        setRegion(next);
        onRegionChange(next);
      }}
      onPress={() => onSelect(null)}
      mapPadding={{ top: padding.top, bottom: padding.bottom, left: 0, right: 0 }}
      userInterfaceStyle={dark ? 'dark' : 'light'}
      customMapStyle={Platform.OS === 'android' && dark ? darkMapStyle : undefined}
      loadingBackgroundColor={palette.background}
      tintColor={palette.primary}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={false}
      showsPointsOfInterests={false}
      showsBuildings
      showsCompass={false}
      toolbarEnabled={false}
      moveOnMarkerPress={false}
      rotateEnabled={false}
    >
      {items.map((item) =>
        item.kind === 'cluster' ? (
          <ClusterMarker
            key={item.id}
            id={item.id}
            latitude={item.latitude}
            longitude={item.longitude}
            count={item.count}
            onPress={() =>
              mapRef.current?.animateToRegion(
                regionForZoom({ latitude: item.latitude, longitude: item.longitude }, item.expansionZoom, region),
                400,
              )
            }
          />
        ) : (
          <PropertyMarker key={item.id} property={item.property} selected={item.id === selectedId} onPress={onSelect} />
        ),
      )}
    </MapView>
  );
}
