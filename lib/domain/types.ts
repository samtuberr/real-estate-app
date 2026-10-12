/**
 * Shared domain types (spec §9, backend-spec §3). Pure TS: no React Native, Expo or
 * Node imports, so the same file runs in the app, Edge Functions (Deno) and Jest.
 */

export type LocalizedText = { he: string; en: string };

export type LatLng = { lat: number; lng: number };

/** [minLng, minLat, maxLng, maxLat], the order PostGIS and supercluster use. */
export type Bbox = [number, number, number, number];

export type PropertyStatus = 'active' | 'sold' | 'off_market';

export const PROPERTY_TYPES = ['apartment', 'garden', 'penthouse', 'house', 'duplex', 'new_project'] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export type PropertyFeatures = {
  elevator: boolean;
  parking: number;
  mamad: boolean;
  balcony: boolean;
  storage: boolean;
};

export type PropertyImage = { url: string; blurhash?: string };

export type ScoreGrade = 'excellent' | 'good' | 'fair' | 'low';
export type SubScoreKey = 'plans' | 'amenities' | 'traffic' | 'market' | 'property';

export type PotentialScore = {
  total: number;
  grade: ScoreGrade;
  confidence: 'high' | 'medium' | 'low';
  subScores: Array<{
    key: SubScoreKey;
    value: number;
    weight: number;
    highlights: LocalizedText[];
  }>;
  algorithmVersion: string;
  computedAt: string;
};

/** Localized so English users don't read transliterated Hebrew street names. */
export type Address = { city: LocalizedText; neighborhood?: LocalizedText; street: LocalizedText; number?: string };

/** Full listing (spec §9 `Property`). */
export type Property = {
  id: string;
  source: string;
  status: PropertyStatus;
  price: number;
  location: LatLng;
  address: Address;
  gushHelka?: { gush: number; helka: number };
  rooms: number;
  sizeSqm: number;
  floor?: number;
  totalFloors?: number;
  propertyType: PropertyType;
  features: PropertyFeatures;
  buildingYear?: number;
  images: PropertyImage[];
  description: LocalizedText;
  score?: PotentialScore;
  createdAt: string;
};

/**
 * Light row returned by `GET /properties?bbox=` (`properties_in_bbox`, backend-spec §10):
 * just enough for map markers and list cards.
 */
export type PropertySummary = Pick<
  Property,
  | 'id'
  | 'status'
  | 'price'
  | 'location'
  | 'address'
  | 'rooms'
  | 'sizeSqm'
  | 'floor'
  | 'propertyType'
  | 'features'
  | 'createdAt'
> & {
  scoreTotal?: number;
  thumbnail?: PropertyImage;
};

export type ComparableDeal = {
  id: string;
  address: LocalizedText;
  date: string;
  price: number;
  rooms: number;
  sizeSqm: number;
};

export type MarketStats = {
  neighborhoodMedianPricePerSqm: number;
  /** 5-year change in median price per sqm, e.g. 0.18 = +18%. */
  fiveYearChange: number;
  priceHistory?: Array<{ year: number; pricePerSqm: number }>;
};

export type CityPlan = {
  id: string;
  planNumber: string;
  name: LocalizedText;
  status: 'proposed' | 'deposited' | 'approved' | 'in_execution';
  type: 'residential' | 'commercial' | 'transit' | 'urban_renewal' | 'public' | 'mixed';
  distanceMeters: number;
  impact: LocalizedText;
  /** GeoJSON coordinates are [longitude, latitude], including the closing point. */
  geometry: { type: 'Polygon'; coordinates: [number, number][][] };
  approvedAt?: string;
};

export const AMENITY_CATEGORIES = [
  'supermarket',
  'shop',
  'cafe',
  'school',
  'kindergarten',
  'park',
  'clinic',
  'synagogue',
] as const;
export type AmenityCategory = (typeof AMENITY_CATEGORIES)[number];
export type AmenityGroup = {
  category: AmenityCategory;
  count: number;
  nearest?: { name: LocalizedText; distanceMeters: number };
};
export type TrafficContext = {
  congestion: 'low' | 'moderate' | 'heavy';
  noise: 'low' | 'moderate' | 'high';
  highwayDistanceMeters: number;
  stops: Array<{ kind: 'bus' | 'train' | 'light_rail'; name: LocalizedText; distanceMeters: number }>;
};

/** Undefined means unavailable; an empty array means a completed survey found none. */
export type PropertyContext = {
  plans?: CityPlan[];
  amenities?: AmenityGroup[];
  traffic?: TrafficContext;
  renewalEligible?: boolean;
};

/** `GET /properties/:id` (`property-detail`): the listing plus its context. */
export type PropertyDetail = Property & {
  comparableDeals: ComparableDeal[];
  market: MarketStats;
} & PropertyContext;

export type FeatureKey = 'parking' | 'elevator' | 'mamad' | 'balcony';

export type PropertyFilters = {
  priceMin?: number;
  priceMax?: number;
  roomsMin?: number;
  sizeMin?: number;
  propertyTypes: PropertyType[];
  minScore?: number;
  features: FeatureKey[];
};

export const SORT_KEYS = ['newest', 'priceAsc', 'priceDesc', 'score'] as const;
export type SortKey = (typeof SORT_KEYS)[number];

/** A city or neighborhood the map search can jump to. */
export type Place = {
  id: string;
  kind: 'city' | 'neighborhood';
  name: LocalizedText;
  city?: LocalizedText;
  center: LatLng;
};
