import Supercluster, { type AnyProps } from 'supercluster';

import type { PropertySummary } from '@/lib/domain/types';

import { type MapRegion, regionToBbox, regionToZoom } from './region';

type PointProps = { id: string };
type ClusterProps = AnyProps;

export type MapItem =
  | { kind: 'property'; id: string; latitude: number; longitude: number; property: PropertySummary }
  | { kind: 'cluster'; id: string; latitude: number; longitude: number; count: number; expansionZoom: number };

export type ClusterIndex = {
  index: Supercluster<PointProps, ClusterProps>;
  byId: Map<string, PropertySummary>;
};

export function createClusterIndex(properties: readonly PropertySummary[]): ClusterIndex {
  const index = new Supercluster<PointProps, ClusterProps>({ radius: 60, maxZoom: 16 });
  index.load(
    properties.map((p) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [p.location.lng, p.location.lat] },
      properties: { id: p.id },
    })),
  );
  return { index, byId: new Map(properties.map((p) => [p.id, p])) };
}

/** Markers and clusters visible in `region`. */
export function getMapItems({ index, byId }: ClusterIndex, region: MapRegion): MapItem[] {
  const zoom = regionToZoom(region);
  return index.getClusters(regionToBbox(region), zoom).flatMap((feature): MapItem[] => {
    const [longitude, latitude] = feature.geometry.coordinates;
    if ('cluster' in feature.properties && feature.properties.cluster) {
      const clusterId = feature.properties.cluster_id;
      return [
        {
          kind: 'cluster',
          id: `cluster-${clusterId}`,
          latitude,
          longitude,
          count: feature.properties.point_count,
          expansionZoom: index.getClusterExpansionZoom(clusterId),
        },
      ];
    }
    const property = byId.get((feature.properties as PointProps).id);
    return property ? [{ kind: 'property', id: property.id, latitude, longitude, property }] : [];
  });
}

/** Region that zooms into a cluster far enough to split it. */
export function regionForZoom(center: { latitude: number; longitude: number }, zoom: number, current: MapRegion): MapRegion {
  const longitudeDelta = 360 / 2 ** zoom;
  const ratio = current.latitudeDelta / current.longitudeDelta;
  return { ...center, longitudeDelta, latitudeDelta: longitudeDelta * ratio };
}
