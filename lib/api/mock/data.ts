/**
 * Deterministic mock dataset for M2 (spec §14). Shaped exactly like the API responses
 * (`GET /properties?bbox=`, `GET /properties/:id`, backend-spec §10) so B2 can swap the
 * repository for Supabase without touching screens. Same seed → same listings on every run.
 */
import { computeScore } from '@/lib/domain/score/compute';
import { buildMockContext } from './context';
import type { ComparableDeal, LocalizedText, Place, PropertyDetail, PropertyType } from '@/lib/domain/types';

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Neighborhood = {
  id: string;
  name: LocalizedText;
  city: LocalizedText;
  center: { lat: number; lng: number };
  /** Spread of listings around the centre, in degrees. */
  spread: number;
  pricePerSqm: number;
  streets: LocalizedText[];
};

const TEL_AVIV = { he: 'תל אביב-יפו', en: 'Tel Aviv-Yafo' };
const RAMAT_GAN = { he: 'רמת גן', en: 'Ramat Gan' };
const GIVATAYIM = { he: 'גבעתיים', en: 'Givatayim' };

const NEIGHBORHOODS: Neighborhood[] = [
  {
    id: 'florentin',
    name: { he: 'פלורנטין', en: 'Florentin' },
    city: TEL_AVIV,
    center: { lat: 32.0565, lng: 34.769 },
    spread: 0.004,
    pricePerSqm: 48000,
    streets: [
      { he: 'פלורנטין', en: 'Florentin' },
      { he: 'ויטל', en: 'Vital' },
      { he: 'העלייה', en: 'HaAliya' },
    ],
  },
  {
    id: 'lev-hair',
    name: { he: 'לב העיר', en: 'City Center' },
    city: TEL_AVIV,
    center: { lat: 32.0705, lng: 34.7745 },
    spread: 0.005,
    pricePerSqm: 60000,
    streets: [
      { he: 'רוטשילד', en: 'Rothschild' },
      { he: 'אלנבי', en: 'Allenby' },
      { he: 'שינקין', en: 'Sheinkin' },
    ],
  },
  {
    id: 'old-north',
    name: { he: 'הצפון הישן', en: 'Old North' },
    city: TEL_AVIV,
    center: { lat: 32.0875, lng: 34.7785 },
    spread: 0.006,
    pricePerSqm: 62000,
    streets: [
      { he: 'ארלוזורוב', en: 'Arlozorov' },
      { he: 'דיזנגוף', en: 'Dizengoff' },
      { he: 'בן יהודה', en: 'Ben Yehuda' },
    ],
  },
  {
    id: 'neve-tzedek',
    name: { he: 'נווה צדק', en: 'Neve Tzedek' },
    city: TEL_AVIV,
    center: { lat: 32.061, lng: 34.765 },
    spread: 0.0025,
    pricePerSqm: 75000,
    streets: [
      { he: 'שבזי', en: 'Shabazi' },
      { he: 'אחד העם', en: "Ahad Ha'am" },
    ],
  },
  {
    id: 'bavli',
    name: { he: 'בבלי', en: 'Bavli' },
    city: TEL_AVIV,
    center: { lat: 32.096, lng: 34.793 },
    spread: 0.003,
    pricePerSqm: 52000,
    streets: [
      { he: 'פנקס', en: 'Pinkas' },
      { he: 'יהודה המכבי', en: 'Yehuda HaMaccabi' },
    ],
  },
  {
    id: 'ramat-aviv',
    name: { he: 'רמת אביב', en: 'Ramat Aviv' },
    city: TEL_AVIV,
    center: { lat: 32.113, lng: 34.798 },
    spread: 0.005,
    pricePerSqm: 55000,
    streets: [
      { he: 'איינשטיין', en: 'Einstein' },
      { he: 'ברודצקי', en: 'Brodetsky' },
    ],
  },
  {
    id: 'yad-eliyahu',
    name: { he: 'יד אליהו', en: 'Yad Eliyahu' },
    city: TEL_AVIV,
    center: { lat: 32.059, lng: 34.792 },
    spread: 0.004,
    pricePerSqm: 40000,
    streets: [
      { he: 'יגאל אלון', en: 'Yigal Alon' },
      { he: 'לה גווארדיה', en: 'La Guardia' },
    ],
  },
  {
    id: 'ramat-gan-center',
    name: { he: 'מרכז העיר', en: 'City Center' },
    city: RAMAT_GAN,
    center: { lat: 32.082, lng: 34.813 },
    spread: 0.005,
    pricePerSqm: 38000,
    streets: [
      { he: 'ביאליק', en: 'Bialik' },
      { he: "ז'בוטינסקי", en: 'Jabotinsky' },
    ],
  },
  {
    id: 'ramat-chen',
    name: { he: 'רמת חן', en: 'Ramat Chen' },
    city: RAMAT_GAN,
    center: { lat: 32.095, lng: 34.824 },
    spread: 0.004,
    pricePerSqm: 42000,
    streets: [
      { he: 'הרא"ה', en: "HaRo'eh" },
      { he: 'אבא הלל', en: 'Abba Hillel' },
    ],
  },
  {
    id: 'givatayim-borochov',
    name: { he: 'בורוכוב', en: 'Borochov' },
    city: GIVATAYIM,
    center: { lat: 32.0705, lng: 34.809 },
    spread: 0.004,
    pricePerSqm: 42000,
    streets: [
      { he: 'כצנלסון', en: 'Katznelson' },
      { he: 'בורוכוב', en: 'Borochov' },
    ],
  },
];

const TYPE_WEIGHTS: [PropertyType, number][] = [
  ['apartment', 0.55],
  ['garden', 0.1],
  ['penthouse', 0.08],
  ['duplex', 0.07],
  ['house', 0.05],
  ['new_project', 0.15],
];

// Neutral blurhashes shown while photos load.
const BLURHASHES = [
  'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
  'L6PZfSi_.AyE_3t7t7R**0o#DgR4',
  'LKO2?U%2Tw=w]~RBVZRi};RPxuwH',
  'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.',
];

const DAY = 24 * 60 * 60 * 1000;
const COUNT = 220;

function build(now: number) {
  const rand = mulberry32(20261005);
  const pick = <T>(items: readonly T[]) => items[Math.floor(rand() * items.length)];
  const between = (min: number, max: number) => min + rand() * (max - min);
  const int = (min: number, max: number) => Math.floor(between(min, max + 1));
  const chance = (p: number) => rand() < p;
  const weighted = <T>(items: [T, number][]) => {
    let r = rand();
    for (const [item, w] of items) {
      if ((r -= w) <= 0) return item;
    }
    return items[0][0];
  };

  const properties: PropertyDetail[] = [];

  for (let i = 0; i < COUNT; i++) {
    const hood = NEIGHBORHOODS[i % NEIGHBORHOODS.length];
    const id = `p-${String(i + 1).padStart(4, '0')}`;
    const propertyType = weighted(TYPE_WEIGHTS);
    const rooms =
      propertyType === 'house'
        ? int(5, 7)
        : propertyType === 'penthouse'
          ? int(4, 6)
          : pick([2, 2.5, 3, 3.5, 4, 4.5, 5]);
    const sizeSqm = Math.round(rooms * between(22, 30) + (propertyType === 'house' ? 60 : 0));
    const totalFloors = propertyType === 'house' ? 2 : propertyType === 'new_project' ? int(8, 30) : int(3, 9);
    const floor =
      propertyType === 'penthouse'
        ? totalFloors
        : propertyType === 'garden' || propertyType === 'house'
          ? 0
          : int(1, totalFloors);
    const buildingYear = propertyType === 'new_project' ? int(2025, 2028) : int(1935, 2022);
    const isNew = propertyType === 'new_project' || buildingYear > 2010;
    const features = {
      elevator: totalFloors > 4 || isNew || chance(0.3),
      parking: isNew ? int(1, 2) : chance(0.4) ? 1 : 0,
      mamad: buildingYear >= 1993 || chance(0.1),
      balcony: chance(0.75),
      storage: chance(0.4),
    };

    const typeFactor = { apartment: 1, garden: 1.12, penthouse: 1.25, duplex: 1.1, house: 1.3, new_project: 1.15 }[
      propertyType
    ];
    const ppsqm = hood.pricePerSqm * typeFactor * between(0.85, 1.15);
    const price = Math.round((sizeSqm * ppsqm) / 10000) * 10000;

    const location = {
      lat: Number((hood.center.lat + between(-hood.spread, hood.spread)).toFixed(6)),
      lng: Number((hood.center.lng + between(-hood.spread, hood.spread)).toFixed(6)),
    };
    const street = pick(hood.streets);

    // A handful of brand-new listings to exercise the "new for you" badge.
    const createdAt = new Date(now - (i % 9 === 0 ? between(0.1, 2.5) : between(3, 120)) * DAY).toISOString();

    const images = Array.from({ length: int(4, 8) }, (_, n) => ({
      url: `https://picsum.photos/seed/nadlan-${id}-${n}/1200/800`,
      blurhash: BLURHASHES[(i + n) % BLURHASHES.length],
    }));

    const comparableDeals: ComparableDeal[] = Array.from({ length: int(3, 6) }, (_, n) => {
      const dealRooms = Math.max(2, rooms + pick([-1, -0.5, 0, 0, 0.5, 1]));
      const dealSize = Math.round(dealRooms * between(22, 30));
      const dealStreet = pick(hood.streets);
      const dealNumber = int(1, 120);
      return {
        id: `${id}-deal-${n}`,
        address: { he: `${dealStreet.he} ${dealNumber}`, en: `${dealNumber} ${dealStreet.en}` },
        date: new Date(now - int(20, 540) * DAY).toISOString().slice(0, 10),
        price: Math.round((dealSize * hood.pricePerSqm * between(0.85, 1.1)) / 10000) * 10000,
        rooms: dealRooms,
        sizeSqm: dealSize,
      };
    }).sort((a, b) => b.date.localeCompare(a.date));

    const roomsText = String(rooms);
    const context = buildMockContext(i, location);
    const fiveYearChange = Number(between(0.05, 0.32).toFixed(2));
    const year = new Date(now).getUTCFullYear();
    const market = {
      neighborhoodMedianPricePerSqm: hood.pricePerSqm,
      fiveYearChange,
      priceHistory: Array.from({ length: 6 }, (_, n) => ({
        year: year - 5 + n,
        pricePerSqm: Math.round((hood.pricePerSqm / (1 + fiveYearChange)) * (1 + (fiveYearChange * n) / 5)),
      })),
    };
    const property: PropertyDetail = {
      id,
      source: 'mock',
      status: chance(0.03) ? 'sold' : 'active',
      price,
      location,
      address: { city: hood.city, neighborhood: hood.name, street, number: String(int(1, 140)) },
      gushHelka: { gush: int(6000, 7400), helka: int(1, 400) },
      rooms,
      sizeSqm,
      floor,
      totalFloors,
      propertyType,
      features,
      buildingYear,
      images,
      description: {
        he: `דירת ${roomsText} חדרים מוארת ב${hood.name.he}, ${sizeSqm} מ״ר${features.balcony ? ' עם מרפסת' : ''}. ${features.mamad ? 'ממ"ד בדירה. ' : ''}קרובה לתחבורה ציבורית, חנויות ובתי ספר.`,
        en: `Bright ${roomsText}-room home in ${hood.name.en}, ${sizeSqm} sqm${features.balcony ? ' with a balcony' : ''}. ${features.mamad ? 'In-apartment safe room. ' : ''}Close to public transport, shops and schools.`,
      },
      createdAt,
      comparableDeals,
      market,
      ...context,
    };
    // A repeatable set of unscored and partially covered listings exercises the UI.
    property.score =
      i % 13 === 12
        ? undefined
        : computeScore({
            ...context,
            property,
            market,
            comparableCount: comparableDeals.length,
            computedAt: new Date(now).toISOString(),
          });
    properties.push(property);
  }

  const places: Place[] = [
    ...[TEL_AVIV, RAMAT_GAN, GIVATAYIM].map((city): Place => {
      const hoods = NEIGHBORHOODS.filter((n) => n.city === city);
      const lat = hoods.reduce((s, n) => s + n.center.lat, 0) / hoods.length;
      const lng = hoods.reduce((s, n) => s + n.center.lng, 0) / hoods.length;
      return { id: `city-${city.en}`, kind: 'city', name: city, center: { lat, lng } };
    }),
    ...NEIGHBORHOODS.map((n): Place => ({
      id: n.id,
      kind: 'neighborhood',
      name: n.name,
      city: n.city,
      center: n.center,
    })),
  ];

  return { properties, places };
}

let cache: ReturnType<typeof build> | undefined;

export function mockData() {
  cache ??= build(Date.now());
  return cache;
}
