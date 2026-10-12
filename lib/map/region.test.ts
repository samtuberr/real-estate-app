import { inBbox, regionToBbox, regionToZoom, snapBbox } from './region';

const region = { latitude: 32, longitude: 34.8, latitudeDelta: 0.1, longitudeDelta: 0.08 };

describe('region helpers', () => {
  it('converts a region to [minLng, minLat, maxLng, maxLat]', () => {
    const [minLng, minLat, maxLng, maxLat] = regionToBbox(region);
    expect(minLng).toBeCloseTo(34.76);
    expect(minLat).toBeCloseTo(31.95);
    expect(maxLng).toBeCloseTo(34.84);
    expect(maxLat).toBeCloseTo(32.05);
  });

  it('derives a web-mercator zoom from the longitude span', () => {
    expect(regionToZoom({ ...region, longitudeDelta: 360 })).toBe(0);
    expect(regionToZoom({ ...region, longitudeDelta: 0.08 })).toBe(12);
    expect(regionToZoom({ ...region, longitudeDelta: 0.0001 })).toBe(20);
  });

  it('checks whether a point is inside a bbox', () => {
    const bbox = regionToBbox(region);
    expect(inBbox({ lat: 32, lng: 34.8 }, bbox)).toBe(true);
    expect(inBbox({ lat: 32.2, lng: 34.8 }, bbox)).toBe(false);
  });

  it('snaps a bbox outward so small pans share a query key', () => {
    const a = snapBbox([34.7612, 31.9501, 34.8388, 32.0499]);
    const b = snapBbox([34.7614, 31.9503, 34.839, 32.0497]);
    expect(a).toEqual(b);
    expect(a).toEqual([34.76, 31.95, 34.84, 32.05]);
  });
});
