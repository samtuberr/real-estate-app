# Spec — Israeli Real Estate App (working name: **"Nadlan Score"**)

> Status: Draft v0.1 · 2026-10-04 · Owner: Sam Tuber
> This file is the source of truth for product scope, stack rules, and architecture. Read it before writing code.

---

## 1. Product Overview

A bilingual (Hebrew / English) mobile app for people buying a home in Israel. It brings together the things a buyer usually has to look up in many separate places:

1. **Map-based property discovery.** Browse listings on a map and open any house to see everything about it.
2. **Potential Score.** A 0–100 score for each property, based on city plans, nearby commercial areas and shops, traffic, and the surrounding housing market.
3. **Rich listing page.** Every listing shows all of the above data, broken down and explained.
4. **Learn hub.** Short articles and a glossary explaining Israeli real estate terms and processes.
5. **Mortgage plans.** Personalized mortgage plans built from the user's financial profile.
6. **Buyer profile (onboarding).** The user enters their situation: single or couple, starting equity, whether they own a home, their bank, credit score, and so on.
7. **Consultation booking.** Before buying, the app offers a call with a mortgage advisor or real estate professional to help close the deal quickly.

### 1.1 Goals
- Help a first-time or returning buyer understand **whether a property is a good buy** and **whether they can afford it**, in one place.
- Turn engaged users into **consultation leads**. This is the business model.
- Work fully in **Hebrew (RTL)** and **English (LTR)**.

### 1.2 Non-Goals (v1)
- Not a listing marketplace where sellers post directly. Listings come from data sources or partners (see §8).
- No in-app transactions, signing, or payments.
- Not licensed financial advice. All scores and plans are **informational estimates** and are labeled that way.

### 1.3 Target Users
| Persona | Description | Key need |
|---|---|---|
| First-time couple | Young couple, has some equity from savings or parents | "What can we afford, and where?" |
| Home upgrader (משפר דיור) | Owns an apartment, wants to sell and upgrade | Timing, bridge financing, tax rules |
| Investor (משקיע) | Already owns property, buying an additional one | Yield, appreciation potential, purchase tax |
| Olim / English speakers | New immigrants unfamiliar with Israeli terms | Glossary, English UI, guided process |

---

## 2. Tech Stack (MUST follow exactly)

| Layer | Tool | Why |
|---|---|---|
| Framework | **Expo (managed) + EAS** | Development builds, OTA updates |
| Navigation | **Expo Router v4** | File-based routing. **Never React Navigation directly.** |
| Styling | **NativeWind v4** (Tailwind for RN) | Fastest learning curve, RTL variants |
| Components | **react-native-reusables** in `/components/ui/` | shadcn ownership model: components live in the repo |
| Complex UI patterns | **Gluestack UI v3** | Modals, sheets, dropdowns. Accessible, pairs with NativeWind. Added through its copy-into-repo CLI, never as a runtime library dependency |
| Lists | **FlashList** (Shopify) | Any list with more than 20 items (property lists, glossary, deals) |
| Images | **expo-image** | Caching, blurhash placeholders |
| Maps | **react-native-maps** | Standard, works with Expo (needs a dev build) |
| Charts | **Victory Native XL** | GPU-accelerated price, yield, and amortization charts |
| Global state | **Zustand** | Profile, filters, saved listings, locale |
| Local state | `useState` | Component-level UI state |
| i18n | `i18next` + `react-i18next` + `expo-localization` | HE/EN strings, number and currency formatting |
| Forms | `react-hook-form` + `zod` | Onboarding and booking forms with validation |
| Secure storage | `expo-secure-store` | Auth tokens and sensitive profile fields |
| Persistence | Zustand `persist` + MMKV (or AsyncStorage) | Offline cache of profile, saved listings |
| Updates | **EAS Update** for JS-only changes · **EAS Build** for native changes | |

> **Version pin:** Expo Router v4 ships with **Expo SDK 52**. Pin the project to SDK 52 unless this rule is updated. (See Open Questions §15.)

### 2.1 Stack Rules

**Must**
- Navigation: Expo Router v4 ONLY.
- Styling: NativeWind v4 `className` ONLY. Never `StyleSheet.create()`.
- Lists: FlashList for any list with more than 20 items. Never `FlatList`.
- Images: `expo-image`. Never React Native `Image`.
- Components: react-native-reusables, copy-pasted into `/components/ui/`. Never install a component library as a dependency.
- State: Zustand for global state, `useState` for local state.
- Updates: EAS Update for JS-only changes. EAS Build for native changes.

**Prohibited**
- Never mix Expo Router and React Navigation.
- Never use NativeWind v2 syntax. v4 needs the Babel preset, the Metro `withNativeWind` wrapper, `global.css`, and `nativewind-env.d.ts`.
- Never call `requestPermissionsAsync()` on mount. Ask for permission only after a user action, e.g. tapping "Near me" on the map.
- Never propose a full rebuild for a JS-only change (copy, translations, styling, logic). Ship it with EAS Update.

**RTL-specific conventions**
- Use logical spacing classes only: `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`. Do not use `ml-*`, `mr-*`, `left-*`, or `right-*` for layout.
- Use the `rtl:` and `ltr:` NativeWind variants for direction-specific tweaks, such as flipping chevron icons.
- Numbers, prices, and phone numbers stay LTR inside RTL text. Wrap them with a `<Num>` helper that applies `writingDirection: 'ltr'`.

---

## 3. Information Architecture & Routes (Expo Router)

```
app/
├── _layout.tsx                    # Root: providers (i18n, theme, query), fonts, RTL bootstrap
├── +not-found.tsx
├── index.tsx                      # Redirect → (onboarding) or (tabs) based on profile state
│
├── (onboarding)/
│   ├── _layout.tsx                # Stack, progress bar header
│   ├── welcome.tsx                # Landing page + language picker (עברית / English)
│   ├── household.tsx              # Single / couple, names, ages, kids
│   ├── finances.tsx               # Income, equity, obligations, employment type
│   ├── ownership.tsx              # Own a home? Selling it? First apartment?
│   ├── banking.tsx                # Bank, credit score range
│   ├── search-goals.tsx           # Stage, cities, budget, rooms, property type
│   └── summary.tsx                # Review + consent → creates profile
│
├── (tabs)/
│   ├── _layout.tsx                # Floating bottom tab bar
│   ├── explore.tsx                # MAP (default tab) + bottom sheet listing list
│   ├── saved.tsx                  # Saved properties (FlashList)
│   ├── mortgage.tsx               # Mortgage plans dashboard
│   ├── learn.tsx                  # Learn hub: guides + glossary
│   └── profile.tsx                # Profile, language, settings
│
├── property/
│   ├── [id].tsx                   # Full listing page
│   └── [id]/
│       ├── score.tsx              # Potential Score deep-dive
│       ├── plans.tsx              # City plans near property
│       └── gallery.tsx            # Full-screen photo gallery
│
├── mortgage/
│   ├── [planId].tsx               # Plan detail: tracks, amortization chart
│   └── calculator.tsx             # Free-form calculator
│
├── learn/
│   ├── [slug].tsx                 # Article
│   └── glossary/[term].tsx        # Glossary term
│
├── consult/
│   ├── book.tsx                   # Modal: book consultation (presentation: 'modal')
│   └── confirmed.tsx
│
└── filters.tsx                    # Modal: map filters
```

Supporting folders:
```
components/
├── ui/                # react-native-reusables + Gluestack copies (Button, Card, Badge, Sheet, Select...)
├── map/               # PropertyMarker, ClusterMarker, MapFilterBar
├── property/          # PropertyCard, ScoreRing, ScoreBreakdown, AmenityList, DealsChart
├── mortgage/          # TrackRow, PlanCard, AmortizationChart, AffordabilityMeter
├── learn/             # ArticleCard, GlossaryRow
└── common/            # Num, Money, SectionHeader, EmptyState, Disclaimer
lib/
├── i18n/              # i18next setup, he.json, en.json
├── score/             # Potential Score engine (pure TS, unit-tested)
├── mortgage/          # Mortgage math + Israeli regulation config (pure TS, unit-tested)
├── tax/               # Purchase tax (מס רכישה) brackets by year
├── api/               # API client, query hooks
└── utils/
stores/                # Zustand stores
constants/             # theme tokens, regulation config
global.css             # Tailwind directives
```

---

## 4. Features

### 4.1 Landing Page & Buyer Profile (Onboarding)

**Welcome / landing:** a hero illustration, the value proposition, a language toggle (עברית / English), and "Get started" and "I already have an account" buttons. Users can choose **"Skip — just browse the map"**. The profile can be completed later. Mortgage plans and consultation booking prompt for it.

Multi-step form with a progress indicator, one topic per screen. Each step is saved to the Zustand store as the user goes, so they can leave and resume.

| Step | Fields | Notes |
|---|---|---|
| Household | Buying as: **Single / Couple** · Names · Ages · Number of children (optional) | Couple → collect both incomes |
| Finances | Net monthly income (each partner) · Employment type (salaried / self-employed / both) · Monthly fixed obligations (loans, leasing) · **Initial equity (הון עצמי)** · Expected additional help (parents, savings plans) | Drives affordability |
| Ownership | **Do you own a home?** (No / Yes, will sell / Yes, keeping it) · First apartment? · Eligible for Mechir Lamishtaken / Dira BeHanacha? (unsure allowed) | Determines buyer type → LTV + purchase tax |
| Banking | **Current bank** (Hapoalim, Leumi, Discount, Mizrahi-Tefahot, First International, Jerusalem, Other) · **Credit score** (self-reported range: Excellent / Good / Fair / Poor / Don't know) · Any past returned checks / restrictions (yes/no) | Credit score is self-reported in v1, with an explanation of how to check it through Israel's credit data system |
| Search goals | **Stage**: Just exploring / Actively looking / Found a property / Signed or closing · Target cities/neighborhoods · Budget range · Rooms · Property type (apartment, garden apt, penthouse, private house, new from contractor) · Purpose (live in / invest) | |
| Summary | Review all answers · Consent checkboxes (privacy, contact for consultation) | Creates profile |

**Derived values** (computed in `lib/mortgage`, shown on the summary and dashboard):
- `buyerType`: `first_home` | `upgrader` | `investor`
- `maxLtv`: Bank of Israel limits, from config (§4.5)
- `maxPropertyPrice`: estimated from equity, LTV, and payment-to-income ratio
- `estimatedMonthlyPayment` range

### 4.2 Explore — Map

- Full-screen `react-native-maps` with **clustered** property markers. Each marker is a price pill colored by Potential Score band (green / amber / red).
- **Top bar:** search (city / neighborhood / street), filter button → `filters.tsx` modal.
- **Bottom sheet** (Gluestack sheet) with 3 snap points: peek (count + sort), half (FlashList of `PropertyCard`), full.
- Tapping a marker shows a mini card above the sheet. Tapping the card opens `property/[id]`.
- **"Near me" button:** location permission is requested **only when tapped**, never on mount.
- **Map layers toggle** (v1.1): city plans polygons, light rail / metro lines, traffic heat, commercial zones.
- Filters: price, rooms, size (sqm), property type, min Potential Score, features (parking, elevator, safe room, balcony), "Within my budget" (from profile).
- The map region and filters live in the `useMapStore` Zustand store and persist across tab switches.

### 4.3 Property Listing Page (`property/[id]`)

Shows **all** information about the house, in this order:

1. **Photo gallery.** Horizontal `expo-image` carousel with blurhash placeholders. Tap opens full-screen gallery.
2. **Header.** Price (₪), address, rooms · sqm · floor, price per sqm, save button, share button.
3. **Potential Score card.** Big score ring (0–100) + grade label + 1-line summary ("Strong upside — metro station planned 400m away"). Tap → `score.tsx`.
4. **Score breakdown.** 5 sub-score bars (see §5) with short explanations.
5. **City plans nearby (תוכניות בניין עיר).** List of relevant approved and pending plans within the radius: name, status, distance, impact (e.g. "Urban renewal — Pinui Binui, approved 2025"). Tap → `plans.tsx` with map polygons.
6. **Commercial & amenities.** Grouped counts within walking distance: supermarkets, shops, cafés, schools, kindergartens, parks, health clinics, synagogues, plus the nearest of each with distance.
7. **Traffic & transportation.** Congestion level at peak hours, nearest bus, train, and light rail stops, highway access, noise indicator.
8. **Nearby houses & market.** Recent comparable deals (from government deals data), price per sqm trend chart (Victory Native XL), and how this listing compares to the neighborhood average.
9. **Property details.** Building year, elevator, parking, safe room (ממ"ד), storage, balcony, condition, arnona estimate, vaad bayit.
10. **Your mortgage for this home.** Uses the profile to show the estimated monthly payment, required equity, and an affordability meter, plus a "See full plan" link to the mortgage screen pre-filled with this price. If there is no profile, shows a CTA to complete it.
11. **Sticky CTA bar:** **"Talk to an expert before you buy"** → `consult/book` (pre-filled with this property).
12. Disclaimer footer.

### 4.4 Learn Hub

Informational content explaining Israeli real estate. Content is stored as structured JSON/MDX per locale and can be updated via **EAS Update** or fetched from the CMS. Text changes never need a rebuild.

**Sections**
- **Guides** (step-by-step articles): "The home-buying process in Israel", "How a mortgage works in Israel", "Buying from a contractor vs. second-hand", "Urban renewal: TAMA 38 vs. Pinui Binui", "Hidden costs of buying a home", "Checklist before signing".
- **Glossary** (FlashList, searchable, A–Z / א–ת). Each term shows its Hebrew name, transliteration, English explanation, and related terms.

**Initial glossary terms (seed):**
| Hebrew | Transliteration | English |
|---|---|---|
| נסח טאבו | Nesach Tabu | Land registry extract |
| מס רכישה | Mas Rechisha | Purchase tax |
| מס שבח | Mas Shevach | Capital gains (betterment) tax |
| היטל השבחה | Hetel Hashbacha | Betterment levy (on plan-driven value increase) |
| תב"ע | Taba | Urban building plan |
| תמ"א 38 | TAMA 38 | National earthquake-reinforcement / expansion plan |
| פינוי בינוי | Pinui Binui | Evacuate-and-rebuild urban renewal |
| הון עצמי | Hon Atzmi | Down payment / equity |
| משכנתא | Mashkanta | Mortgage |
| מסלול פריים | Prime track | Variable rate tied to Prime |
| קבועה לא צמודה | Kalatz | Fixed, non-CPI-linked track |
| קבועה צמודה | Katz | Fixed, CPI-linked track |
| משתנה כל 5 שנים | Variable every 5 | Rate resets every 5 years |
| צמוד מדד | Tzamud Madad | Linked to consumer price index |
| שמאי | Shamai | Property appraiser |
| עורך דין מקרקעין | Real-estate lawyer | |
| יועץ משכנתאות | Mortgage advisor | |
| ארנונה | Arnona | Municipal property tax |
| ועד בית | Vaad Bayit | Building maintenance committee |
| ממ"ד | Mamad | In-apartment safe room |
| זכויות בנייה | Zchuyot Bniya | Building rights |
| היתר בנייה | Heter Bniya | Building permit |
| מחיר למשתכן / דירה בהנחה | Mechir Lamishtaken / Dira BeHanacha | Government subsidized housing lottery |
| אישור עקרוני | Ishur Ekroni | Mortgage pre-approval |
| זיכרון דברים | Zichron Dvarim | Preliminary memorandum of agreement |
| הערת אזהרה | He'arat Azhara | Caveat / warning note on land registry |

- Each article ends with "Got questions? **Talk to an expert**" → consultation CTA.

### 4.5 Mortgage Plans

**Dashboard (`(tabs)/mortgage`)**
- Affordability summary: max property price, required equity, max loan, estimated monthly payment, and payment-to-income ratio gauge.
- **3 suggested plans** generated from the profile:
  - **Stable.** More fixed, non-linked tracks. Higher payment, predictable.
  - **Balanced.** Typical mix.
  - **Flexible / lower start.** More Prime/variable. Lower initial payment, more risk.
- Each `PlanCard` shows the monthly payment, total repayment, total interest, and the track mix as a donut.
- "Compare plans" view (side by side).

**Plan detail (`mortgage/[planId]`)**
- Track table: track type, share %, amount, rate, term, linkage, monthly payment.
- Amortization chart over time (Victory Native XL): principal vs. interest, plus a CPI scenario toggle for linked tracks.
- Editable sliders: loan amount, term (4–30 years), track mix.
- **Total cost of purchase** breakdown: price + purchase tax + lawyer + agent + appraiser + mortgage advisor + moving and renovation buffer.
- CTA: **"Get a real offer — talk to a mortgage advisor"** → consultation.

**Calculation rules (in `lib/mortgage`, pure TS, unit-tested)**
- Monthly payment uses the standard annuity (Spitzer) formula per track. Equal-principal is an optional toggle.
- CPI-linked tracks use a configurable expected CPI assumption.
- Regulation values live in a **versioned config** (`constants/regulation.ts`), never hard-coded in components. Initial values must be **verified against current Bank of Israel directives before launch**:
  - Max LTV: first home ~75%, upgrader ~70%, investor ~50%
  - Max payment-to-income ratio: 50% (app recommends ≤ ~33%)
  - Track mix constraints (e.g. minimum fixed-rate share, maximum Prime share)
  - Max term: 30 years
- Purchase tax brackets are stored per year in `lib/tax/brackets.ts` and depend on `buyerType`.
- Rates are fetched from the backend (admin-maintained market averages), with a fallback default.

### 4.6 Consultation Booking

The key conversion step: **before the user buys, offer a consultation so they can close quickly and safely.**

**Entry points:** listing sticky CTA, mortgage plan CTA, learn articles, profile "Ready to buy?" banner, and an automatic prompt when the user's stage becomes "Found a property".

**Flow (`consult/book`, modal):**
1. **Choose expert:** Mortgage advisor · Real estate agent · Real-estate lawyer · Appraiser · "Full closing package" (all-in-one, recommended).
2. **Context** (pre-filled): selected property (if any), profile summary, a stage note ("I want to close within X weeks").
3. **Contact & time:** name, phone (Israeli format validation), preferred language (HE/EN/RU/FR...), preferred contact method (phone / WhatsApp / video), and 2–3 preferred time slots.
4. **Consent:** agree to share profile data with the expert.
5. **Confirmation** (`consult/confirmed`): summary, expected callback time, add-to-calendar, and a "What to prepare" checklist (payslips, bank statements, ID, Tabu extract).

**Backend:** creates a `Lead` record, notifies the partner/CRM (webhook / email / WhatsApp Business), and tracks status (`new → contacted → in_progress → closed_won / closed_lost`). Users see their request status in Profile.

### 4.7 Profile & Settings
- Edit buyer profile (re-runs the derived calculations).
- Language: עברית / English (see §6 for RTL switching).
- Saved searches & notifications (v1.1: alerts for new listings matching filters / score above X).
- Consultation requests and their status.
- Privacy: export data, delete account.
- Legal: terms, privacy policy, disclaimers.

---

## 5. Potential Score — Algorithm Spec

A 0–100 score estimating a property's **future value potential**. It is computed **server-side** (consistent, cacheable, tunable without app releases). The same engine is in `lib/score` for previews and tests.

### 5.1 Sub-scores

| # | Sub-score | Weight | Inputs | Higher score when… |
|---|---|---|---|---|
| 1 | **City Plans & Development** | 30% | Approved/pending urban plans (תב"ע) within ~1km, urban renewal (TAMA 38 / Pinui Binui) eligibility of the building, planned transit (light rail / metro / train station) within 800m, new public buildings/parks | Approved plans and transit nearby, building eligible for renewal |
| 2 | **Commercial & Amenities** | 20% | Count and distance of shops, supermarkets, cafés, schools, kindergartens, parks, clinics; planned commercial centers | Rich amenities within a 5–10 min walk |
| 3 | **Traffic & Access** | 15% | Peak-hour congestion on nearby roads (negative), public transit access (positive), highway access (positive), noise from major roads (negative) | Good access without heavy congestion or noise at the doorstep |
| 4 | **Neighborhood Market** | 25% | Recent comparable deals, 3–5 yr price-per-sqm trend, listing price vs. neighborhood median, new construction supply, demand signals | Rising trend, listing priced at or below median |
| 5 | **Property Factors** | 10% | Building age, floor, elevator, parking, safe room, size, condition | Features that hold value. Old building plus renewal eligibility counts as upside |

`score = round(Σ weight_i × subScore_i)`, where each `subScore_i` is in 0–100.

### 5.2 Output
```ts
type PotentialScore = {
  total: number;                 // 0–100
  grade: 'excellent' | 'good' | 'fair' | 'low';   // ≥80, 65–79, 50–64, <50
  confidence: 'high' | 'medium' | 'low';          // based on data coverage
  subScores: Array<{
    key: 'plans' | 'amenities' | 'traffic' | 'market' | 'property';
    value: number;
    weight: number;
    highlights: LocalizedText[];  // e.g. "Light rail station planned 350m away"
  }>;
  algorithmVersion: string;       // e.g. "1.0.0"
  computedAt: string;
};
```

### 5.3 Rules
- Every number shown to the user comes with a **plain-language reason** (highlights).
- If data for a sub-score is missing, its weight is redistributed and `confidence` drops. The UI shows "Limited data".
- Weights and thresholds live in a server config and are versioned. Changing them never requires an app build.
- Always shown with the disclaimer: *"Estimate for information only — not an appraisal or investment advice."*

---

## 6. Internationalization & RTL

- Languages: **Hebrew (default for `he-*` device locale)** and **English (default otherwise)**.
- `i18next` namespaces: `common`, `onboarding`, `explore`, `property`, `mortgage`, `learn`, `consult`, `glossary`.
- **RTL switching:** use `I18nManager.allowRTL(true)` and `I18nManager.forceRTL(isHebrew)`. The change needs an app reload, so after a language change call `Updates.reloadAsync()` (expo-updates). Show a confirmation ("The app will restart to apply the language").
- Formatting: `Intl.NumberFormat(locale, { style: 'currency', currency: 'ILS' })` → `₪1,850,000`. Dates use `Intl.DateTimeFormat`.
- Fonts with full Hebrew + Latin coverage: **Rubik** (primary, rounded and friendly, fits the design reference) or **Heebo**. Loaded via `expo-font`.
- Directional icons (chevrons, back arrows) flip with `rtl:` classes / `rtl:-scale-x-100`.
- Translation copy changes ship through **EAS Update**, never a full build.
- All user-facing strings go through `t()`. No hard-coded text in components (lint rule).

---

## 7. Design System

**Visual reference:** [Insurance Mobile App UI Design (Dribbble)](https://dribbble.com/shots/26673273-Insurance-Mobile-App-UI-Design). The direction is a clean, friendly fintech/insurance look adapted to real estate.

> The tokens below are a **proposed starting point** in that style. Validate the exact colors and spacing against the Dribbble shot before building the UI.

**Principles**
- Light, airy background with **large rounded cards** (radius 24–28) and soft, low shadows.
- **One strong primary color** plus **pastel accent cards** to group information (score, mortgage, amenities).
- **Big bold numbers** for key figures (price, score, monthly payment) with small muted labels.
- Pill-shaped chips and buttons. Generous whitespace. Friendly icons or 3D-style illustrations on onboarding and empty states.
- **Floating bottom tab bar** (rounded, elevated, active tab highlighted with a filled pill).

**Proposed tokens** (defined in `tailwind.config.js` + CSS variables in `global.css` for light/dark):
| Token | Value (proposal) | Use |
|---|---|---|
| `primary` | `#3D5AFE`-ish deep blue/indigo | CTAs, active tab, links |
| `primary-foreground` | `#FFFFFF` | |
| `background` | `#F5F6FA` | App background |
| `card` | `#FFFFFF` | Cards |
| `accent-mint` | `#DFF5EC` | Score / positive cards |
| `accent-peach` | `#FFE9DD` | Mortgage cards |
| `accent-lavender` | `#ECE8FF` | Learn cards |
| `accent-sky` | `#E3F1FF` | Amenities / map info |
| `score-high` / `score-mid` / `score-low` | green / amber / red | Score rings, markers |
| `foreground` / `muted-foreground` | `#111827` / `#6B7280` | Text |
| Radius | `xl: 16`, `2xl: 24`, `3xl: 28`, `full` | |
| Spacing | 4-pt scale (Tailwind default) | |
| Type scale | Display 32/bold · H1 24/semibold · H2 20 · Body 16 · Caption 13 | Rubik |

**Key components:** `ScoreRing`, `PropertyCard` (image top, price, chips, score badge), `StatTile`, `PlanCard`, `TrackRow`, `AffordabilityMeter`, `SectionHeader`, `StickyCTA`, `FloatingTabBar`, `Chip`, `Sheet`.

**Accessibility:** minimum 44×44 touch targets, WCAG AA contrast, `accessibilityLabel` on all icon buttons, Dynamic Type supported, screen-reader order correct in RTL.

---

## 8. Data Sources (to validate licensing & availability)

| Data | Candidate source | Notes |
|---|---|---|
| Listings | Partner agencies / brokers feed, own admin uploads | Yad2/Madlan scraping is **not** allowed. Partnerships required |
| Past deals / prices | Israel Tax Authority real estate deals data (nadlan.gov.il) | Comparable deals, price trends |
| City plans | Israel Planning Administration (iplan / מנהל התכנון), municipal GIS | Plan polygons, status |
| Maps / GIS layers | GovMap, data.gov.il | Parcels (גוש/חלקה), zoning |
| Transit | Ministry of Transport GTFS, NTA (light rail / metro plans) | Stations, planned lines |
| Amenities / POI | Google Places API or OpenStreetMap (Overpass) | Shops, schools, parks |
| Traffic | Google Routes / Distance Matrix (traffic-aware), Waze for Cities | Peak congestion |
| Demographics | Central Bureau of Statistics (CBS / הלמ"ס) | Socio-economic cluster |
| Mortgage rates | Bank of Israel published average rates | Admin-maintained in backend |

Data ingestion runs as **scheduled backend jobs**, not in the app. The app only calls the backend API.

---

## 9. Backend & Data Model (proposal)

**Proposed backend:** Supabase (Postgres + **PostGIS** for geo queries + Auth + Edge Functions + Storage). Alternative: a custom Node API. See Open Questions.

**Core entities**
```ts
type Property = {
  id: string;
  source: string;
  status: 'active' | 'sold' | 'off_market';
  price: number;                   // ILS
  location: { lat: number; lng: number };
  address: { city: string; neighborhood?: string; street: string; number?: string };
  gushHelka?: { gush: number; helka: number };
  rooms: number;
  sizeSqm: number;
  floor?: number;
  totalFloors?: number;
  propertyType: 'apartment' | 'garden' | 'penthouse' | 'house' | 'duplex' | 'new_project';
  features: { elevator: boolean; parking: number; mamad: boolean; balcony: boolean; storage: boolean };
  buildingYear?: number;
  images: { url: string; blurhash?: string }[];
  description: LocalizedText;
  score?: PotentialScore;
};

type CityPlan = {
  id: string; planNumber: string; name: LocalizedText;
  status: 'proposed' | 'deposited' | 'approved' | 'in_execution';
  type: 'residential' | 'commercial' | 'transit' | 'urban_renewal' | 'public' | 'mixed';
  geometry: GeoJSON.Polygon; approvedAt?: string;
};

type BuyerProfile = {
  householdType: 'single' | 'couple';
  members: { name: string; age?: number; netMonthlyIncome: number; employment: 'salaried' | 'self_employed' }[];
  children?: number;
  monthlyObligations: number;
  initialEquity: number;
  additionalHelp?: number;
  ownership: 'none' | 'own_will_sell' | 'own_keep';
  firstApartment: boolean;
  subsidizedEligible?: 'yes' | 'no' | 'unsure';
  bank: BankId;
  creditScoreRange: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  stage: 'exploring' | 'looking' | 'found_property' | 'closing';
  targetCities: string[];
  budget: { min?: number; max?: number };
  rooms?: { min?: number; max?: number };
  purpose: 'live' | 'invest';
  locale: 'he' | 'en';
  consents: { privacy: boolean; contactForConsultation: boolean; at: string };
};

type MortgagePlan = {
  id: string; name: 'stable' | 'balanced' | 'flexible' | 'custom';
  loanAmount: number; tracks: MortgageTrack[];
  monthlyPayment: number; totalRepayment: number; totalInterest: number;
};

type MortgageTrack = {
  type: 'prime' | 'fixed_unlinked' | 'fixed_linked' | 'variable5_unlinked' | 'variable5_linked';
  share: number; amount: number; rate: number; termYears: number;
};

type Lead = {
  id: string; userId: string; expertType: 'mortgage' | 'agent' | 'lawyer' | 'appraiser' | 'package';
  propertyId?: string; phone: string; preferredLanguage: string;
  contactMethod: 'phone' | 'whatsapp' | 'video'; timeSlots: string[];
  status: 'new' | 'contacted' | 'in_progress' | 'closed_won' | 'closed_lost';
  createdAt: string;
};

type LocalizedText = { he: string; en: string };
```

**Key API endpoints**
- `GET /properties?bbox=&filters=` returns clustered or paged properties for the map viewport
- `GET /properties/:id` returns the full listing, score, plans, amenities, traffic, and comparable deals
- `GET /plans?bbox=` returns city plan polygons
- `GET /content/learn?locale=` · `GET /content/glossary?locale=`
- `GET /mortgage/rates`
- `POST /profile` · `PATCH /profile`
- `POST /leads` · `GET /leads/mine`

---

## 10. State Management (Zustand)

| Store | Contents | Persisted |
|---|---|---|
| `useProfileStore` | `BuyerProfile`, onboarding progress, derived affordability | Yes (sensitive fields in secure store) |
| `useMapStore` | Region, filters, selected property id, layer toggles | Region + filters |
| `useSavedStore` | Saved property ids, saved searches | Yes |
| `useMortgageStore` | Generated plans, custom plan edits | Yes |
| `useSettingsStore` | Locale, theme, notification prefs | Yes |

Server data (listings, scores, content) is fetched with **TanStack Query** for caching and loading states. Zustand holds client state only.

---

## 11. Permissions

| Permission | When requested | Never |
|---|---|---|
| Location (foreground) | User taps **"Near me"** on the map | On app launch or screen mount |
| Notifications | User enables alerts in Saved Searches or after booking ("Notify me when an expert responds") | On first launch |
| Calendar (optional) | User taps "Add to calendar" on confirmation | Otherwise |

Each request is preceded by an in-app explanation screen. If the user denies, the app degrades gracefully (e.g. manual city search).

---

## 12. Privacy, Security & Legal

- Financial and credit data is **sensitive personal data** under the Israeli Privacy Protection Law (incl. Amendment 13). Requirements: explicit consent, a data minimization review, encryption in transit (TLS) and at rest, a documented database registration review, and the right to access and delete data.
- Tokens and sensitive fields are stored with `expo-secure-store`. Raw credit details are never logged.
- Profile data is shared with consultants **only after explicit consent** in the booking flow.
- Disclaimers on Potential Score, mortgage plans, and Learn content: informational only, not financial / legal / appraisal advice.
- Partner consultants should be licensed (e.g. licensed real estate agents). Verification process is TBD.

---

## 13. Builds, Updates & Environments

- **Development builds** (`expo-dev-client`) are required because of `react-native-maps` config (Google Maps API key on Android) and native modules.
- EAS profiles: `development`, `preview` (internal testing), `production`.
- EAS Update channels: `preview`, `production`.
- **JS-only changes** (UI, copy, translations, score display logic, content) → `eas update`.
- **Native changes** (new native module, permissions, app config, SDK upgrade, map keys) → `eas build`.
- Secrets (Google Maps key, Supabase keys) go in EAS environment variables. They are never committed.

---

## 14. Milestones

| Phase | Scope |
|---|---|
| **M0: Foundation** | Expo SDK 52 + Expo Router v4 + NativeWind v4 setup, i18n + RTL bootstrap, design tokens, `/components/ui` base components, floating tab bar, EAS project |
| **M1: Onboarding & Profile** | Landing page, multi-step profile form, Zustand persistence, derived affordability |
| **M2: Map & Listings** | Map with clusters, bottom sheet FlashList, filters, listing page (with mock data) |
| **M3: Potential Score** | Score engine (server + `lib/score`), score card + deep-dive, plans / amenities / traffic sections |
| **M4: Mortgage** | Mortgage math lib + tests, 3 plans, plan detail with charts, total cost of purchase |
| **M5: Learn Hub** | Guides + glossary (HE/EN), search |
| **M6: Consultation** | Booking flow, leads backend, status tracking, CTAs across the app |
| **M7: Real data & launch** | Data source integrations, privacy review, store submission |

---

## 15. Open Questions

1. **Expo SDK version:** Rules pin Expo Router **v4** (SDK 52). Newer SDKs ship newer Router versions. Keep the pin, or update the rule to the latest SDK?
2. **Listing source:** Which brokers or partners will supply listings in v1? Or launch with a curated dataset in one city first (e.g. Tel Aviv / Ramat Gan / Haifa)?
3. **Backend:** Is Supabase + PostGIS approved, or is there a preferred backend?
4. **Consultants:** In-house team or partner network? How are leads routed and monetized (fixed fee, referral, success fee)?
5. **Authentication:** Phone OTP (common in Israel), Google/Apple sign-in, or both? Can users browse anonymously?
6. **Credit score:** Self-reported only, or integrate with a licensed credit bureau later?
7. **Additional languages:** Russian / French / Arabic in a later phase?
8. **Design:** Confirm the exact palette and typography from the Dribbble reference, or produce a Figma file first?
