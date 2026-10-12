import { AMENITY_CATEGORIES, type CityPlan, type LatLng, type PropertyContext } from '@/lib/domain/types';

/** All names, polygons and observations here are fictional demonstration fixtures. */
export function buildMockContext(index: number, location: LatLng): PropertyContext {
  const polygon = (dx: number, dy: number): CityPlan['geometry'] => {
    const x = location.lng + dx;
    const y = location.lat + dy;
    return {
      type: 'Polygon',
      coordinates: [
        [
          [x, y],
          [x + 0.0015, y],
          [x + 0.0015, y + 0.001],
          [x, y + 0.001],
          [x, y],
        ],
      ],
    };
  };
  const plans: CityPlan[] = [
    {
      id: `demo-renewal-${index}`,
      planNumber: `DEMO-${index + 1}-A`,
      name: { en: 'Neighborhood renewal — demo', he: 'התחדשות שכונתית — הדגמה' },
      status: index % 3 === 0 ? 'approved' : 'deposited',
      type: 'urban_renewal',
      distanceMeters: 180,
      geometry: polygon(0.001, 0.0013),
      impact: {
        en: 'Illustrative renewal area with housing and public space. Inclusion does not establish building rights.',
        he: 'אזור התחדשות להמחשה עם מגורים ושטח ציבורי. הכללה אינה מעידה על זכויות בנייה.',
      },
      ...(index % 3 === 0 ? { approvedAt: '2025-06-01' } : {}),
    },
    {
      id: `demo-transit-${index}`,
      planNumber: `DEMO-${index + 1}-B`,
      name: { en: 'Planned transit plaza — demo', he: 'כיכר תחבורה מתוכננת — הדגמה' },
      status: index % 2 === 0 ? 'proposed' : 'in_execution',
      type: 'transit',
      distanceMeters: 420,
      geometry: polygon(-0.003, -0.003),
      impact: {
        en: 'Illustrative future transit access; construction may bring temporary disruption.',
        he: 'נגישות עתידית לתחבורה להמחשה; הבנייה עלולה לגרום להפרעות זמניות.',
      },
    },
  ];
  return {
    plans: index % 11 === 10 ? undefined : index % 7 === 6 ? [] : plans,
    renewalEligible: index % 3 === 0,
    amenities:
      index % 11 === 10
        ? undefined
        : AMENITY_CATEGORIES.map((category, n) => {
            const count = (index + n * 3) % 6;
            return {
              category,
              count,
              ...(count > 0
                ? {
                    nearest: {
                      name: { en: `Demo place ${n + 1}`, he: `מקום לדוגמה ${n + 1}` },
                      distanceMeters: 100 + ((index * 19 + n * 73) % 650),
                    },
                  }
                : {}),
            };
          }),
    traffic:
      index % 5 === 4 || index % 11 === 10
        ? undefined
        : {
            congestion: (['low', 'moderate', 'heavy'] as const)[index % 3],
            noise: (['low', 'moderate', 'high'] as const)[(index + 1) % 3],
            highwayDistanceMeters: 1100 + (index % 6) * 400,
            stops: [
              {
                kind: 'bus',
                name: { en: 'Local bus stop — demo', he: 'תחנת אוטובוס מקומית — הדגמה' },
                distanceMeters: 150 + (index % 5) * 40,
              },
              {
                kind: 'light_rail',
                name: { en: 'Light rail stop — demo', he: 'תחנת רכבת קלה — הדגמה' },
                distanceMeters: 500 + (index % 4) * 120,
              },
              {
                kind: 'train',
                name: { en: 'Railway station — demo', he: 'תחנת רכבת — הדגמה' },
                distanceMeters: 1800 + (index % 3) * 250,
              },
            ],
          },
  };
}
