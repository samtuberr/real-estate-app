import { mockData } from '@/lib/api/mock/data';
import { toSummary } from '@/lib/api/properties';

import { createClusterIndex, getMapItems, regionForZoom } from './cluster';
import { DEFAULT_REGION } from './region';

const summaries = mockData().properties.map(toSummary);

function countHomes(items: ReturnType<typeof getMapItems>) {
  return items.reduce((n, item) => n + (item.kind === 'cluster' ? item.count : 1), 0);
}

describe('clustering', () => {
  const index = createClusterIndex(summaries);

  it('groups markers when zoomed out and keeps every home accounted for', () => {
    const wide = { ...DEFAULT_REGION, latitudeDelta: 1, longitudeDelta: 1 };
    const items = getMapItems(index, wide);
    expect(items.some((i) => i.kind === 'cluster')).toBe(true);
    expect(countHomes(items)).toBe(summaries.length);
  });

  it('shows individual markers when zoomed in on a street', () => {
    const p = summaries[0];
    const close = { latitude: p.location.lat, longitude: p.location.lng, latitudeDelta: 0.001, longitudeDelta: 0.001 };
    const items = getMapItems(index, close);
    expect(items.find((i) => i.kind === 'property' && i.id === p.id)).toBeDefined();
  });

  it('zooms into a cluster far enough to split it', () => {
    const wide = { ...DEFAULT_REGION, latitudeDelta: 1, longitudeDelta: 1 };
    const cluster = getMapItems(index, wide).find((i) => i.kind === 'cluster');
    if (cluster?.kind !== 'cluster') throw new Error('expected a cluster');
    const next = regionForZoom(cluster, cluster.expansionZoom, wide);
    expect(next.longitudeDelta).toBeLessThan(wide.longitudeDelta);
    expect(next.latitude).toBe(cluster.latitude);
  });
});
