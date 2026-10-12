import type { Bbox, LatLng } from '@/lib/domain/types';

/** Same shape as react-native-maps `Region`, kept here so pure code doesn't import the native module. */
export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

/** Gush Dan: Tel Aviv, Ramat Gan, Givatayim. The default view until the user moves the map. */
export const DEFAULT_REGION: MapRegion = {
  latitude: 32.0775,
  longitude: 34.7975,
  latitudeDelta: 0.09,
  longitudeDelta: 0.06,
};

export function regionToBbox(r: MapRegion): Bbox {
  return [
    r.longitude - r.longitudeDelta / 2,
    r.latitude - r.latitudeDelta / 2,
    r.longitude + r.longitudeDelta / 2,
    r.latitude + r.latitudeDelta / 2,
  ];
}

/** Web-mercator zoom level for a region, as supercluster expects (0 = whole world). */
export function regionToZoom(r: MapRegion): number {
  return Math.max(0, Math.min(20, Math.round(Math.log2(360 / r.longitudeDelta))));
}

export function inBbox({ lat, lng }: LatLng, [minLng, minLat, maxLng, maxLat]: Bbox): boolean {
  return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
}

/** Region centred on a point, used for "Near me" and search results. */
export function regionAround({ lat, lng }: LatLng, delta = 0.02): MapRegion {
  return { latitude: lat, longitude: lng, latitudeDelta: delta, longitudeDelta: delta };
}

/**
 * Rounds a bbox outward to a grid so tiny pans reuse the same query key instead
 * of refetching on every frame.
 */
export function snapBbox([minLng, minLat, maxLng, maxLat]: Bbox, step = 0.005): Bbox {
  const down = (v: number) => Math.floor(v / step) * step;
  const up = (v: number) => Math.ceil(v / step) * step;
  const round = (v: number) => Number(v.toFixed(6));
  return [round(down(minLng)), round(down(minLat)), round(up(maxLng)), round(up(maxLat))];
}
