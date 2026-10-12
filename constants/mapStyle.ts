import type { MapStyleElement } from 'react-native-maps';

/**
 * Google Maps "deep space" style for Android in dark mode (spec §7). Apple Maps on iOS
 * follows `userInterfaceStyle` instead. Colors track the dark tokens in `theme.ts`.
 */
export const darkMapStyle: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#0E101A' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8B93B0' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#05060B' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#222638' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#161926' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0A2622' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1B1F30' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#262B42' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#6E7699' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#161926' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#3EE6FF' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#05060B' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3D4566' }] },
];
