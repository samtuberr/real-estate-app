# Spec — Israeli Real Estate App (working name: **"Nadlan Score"**)

> Status: Draft v0.2 · 2026-10-04 · Owner: Sam Tuber
> v0.2: moved to Expo SDK 57 (latest stable), native tabs + native headers, `@expo/ui`, Liquid Glass, and the "Orbit" design system.
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

**Platform targets:** iOS 26 (Liquid Glass) with graceful fallback to older supported iOS versions, and Android 16 (Material 3 Expressive) with edge-to-edge. One codebase. Built with the current Xcode / Android SDK that the App Store and Google Play require.

| Layer | Tool | Why |
|---|---|---|
| Framework | **Expo SDK 57** (React Native 0.86, React 19.2, New Architecture, Hermes V1) + **EAS** | Latest stable SDK. Development builds, OTA updates, store-compliant native toolchains |
| Compiler | **React Compiler** (`experiments.reactCompiler`) | Automatic memoization. No hand-written `useMemo` / `useCallback` for performance |
| Navigation | **Expo Router 57** | File-based routing. Import navigation APIs from `expo-router` (incl. `expo-router/react-navigation`), **never `@react-navigation/*` directly** |
| Tab bar | **Native tabs** (`expo-router/unstable-native-tabs`) | Real system tab bar: Liquid Glass + minimize-on-scroll on iOS 26, Material 3 navigation bar on Android |
| Headers | **Native Stack** inside each tab | Large collapsing titles, glass scroll-edge effect, back-swipe. Configured, never hand-built |
| Styling | **NativeWind v4.2** (Tailwind v3) | `className` styling with RTL variants. Re-evaluate NativeWind v5 / Tailwind v4 when it leaves RC |
| Components | **react-native-reusables** pattern in `/components/ui/` | shadcn ownership model: components live in the repo |
| Native controls | **`@expo/ui`** (SwiftUI on iOS, Jetpack Compose on Android) | Bottom sheets, pickers, sliders, switches, menus, grouped forms. Check `@expo/ui` first before building or installing any control |
| Glass & materials | **`expo-glass-effect`** (iOS 26 Liquid Glass) + **`expo-blur`** fallback | Floating map controls, search bar, sheets. Wrapped in `<Glass>` (see §7) |
| Icons | **`expo-symbols`** | SF Symbols on iOS, Material Symbols on Android/web. One registry in `constants/icons.ts`. No icon fonts, no emoji icons |
| Motion | **Reanimated 4** (+ `react-native-worklets`) + **Gesture Handler** | CSS-style transitions/animations and gesture-driven UI on the UI thread |
| Haptics | **`expo-haptics`** | Light impact on primary actions, selection ticks on chips/pickers, success on booking |
| Graphics | **`@shopify/react-native-skia`** (added in M3/M4) | Glowing score ring, animated gradients, chart rendering |
| Charts | **Victory Native XL** (Skia-based) | GPU-accelerated price, yield, and amortization charts |
| Gradients | RN `experimental_backgroundImage` (CSS `linear-gradient` / `radial-gradient`) | No `expo-linear-gradient` |
| Lists | **FlashList v2** (Shopify) | Any list with more than 20 items (property lists, glossary, deals) |
| Images | **expo-image** | Caching, blurhash placeholders, shared-element-friendly transitions |
| Maps | **react-native-maps** | Apple Maps on iOS (3D, native look), Google Maps on Android; `supercluster` for clustering. Needs a dev build |
| Global state | **Zustand** | Profile, filters, saved listings, locale, theme |
| Server state | **TanStack Query v5** | Listings, scores, content. Caching and loading states |
| Local state | `useState` | Component-level UI state |
| i18n | `i18next` + `react-i18next` + `expo-localization` | HE/EN strings, number and currency formatting |
| Forms | `react-hook-form` + `zod` | Onboarding and booking forms with validation |
| Secure storage | `expo-secure-store` | Auth tokens and sensitive profile fields |
| Persistence | Zustand `persist` + **`expo-sqlite/localStorage`** | Offline cache of profile, saved listings. Replaces AsyncStorage (deprecated) |
| Updates | **EAS Update** for JS-only changes · **EAS Build** for native changes | |

> **Version policy:** Track the latest stable Expo SDK. Upgrade within one cycle of each new SDK release using `npx expo install expo@latest && npx expo install --fix`, then `npx expo-doctor`. Never pin to an old SDK: store toolchain requirements (Xcode / Android target API) move every year. Do not use SDK 56 or `expo@57.0.8` and below (Hermes V1 memory regression with Reanimated).

### 2.1 Stack Rules

**Must**
- Navigation: Expo Router only. Tabs use `NativeTabs`; every tab nests a native `Stack` for its header.
- Styling: NativeWind `className` first. Inline `style` is allowed only for values `className` can't express: Reanimated animated styles, `boxShadow` glows, `experimental_backgroundImage` gradients, `borderCurve`, and dynamic values (safe-area insets). Never `StyleSheet.create()`.
- Colors: tokens only (`bg-card`, `text-muted-foreground`, …). Native props that need hex use `usePalette()` / `constants/theme.ts`. Never hard-coded `#fff` / `#000`.
- Icons: `<Icon name="…" />` from `components/ui/icon.tsx`, names registered in `constants/icons.ts` with both an SF Symbol and a Material Symbol.
- Controls: check `@expo/ui` first for sheets, pickers, sliders, switches, menus and grouped settings lists.
- Lists: FlashList for any list with more than 20 items. Never `FlatList`.
- Images: `expo-image`. Never React Native `Image`.
- Pressables: `Pressable` only. Never `TouchableOpacity` / `TouchableHighlight`.
- Components: react-native-reusables, copy-pasted into `/components/ui/`. Never install a JS component library (Gluestack, Tamagui, Paper…) as a dependency.
- State: Zustand for global state, `useState` for local state, TanStack Query for server state.
- Packages: install with `npx expo install <pkg>` so versions match the SDK.
- Updates: EAS Update for JS-only changes. EAS Build for native changes.

**Prohibited**
- Never import from `@react-navigation/*`. Never build a custom tab bar or hand-rolled header (`headerShown: false` + a `<Text>` title). The only exception is the full-screen map, which floats glass controls instead of a header.
- Never use NativeWind v2 syntax. v4 needs the Babel preset, the Metro `withNativeWind` wrapper, `global.css`, and `nativewind-env.d.ts`.
- Never use deprecated packages: `expo-av`, `@react-native-async-storage/async-storage`, `expo-linear-gradient`, `@expo/vector-icons`, `lucide-react-native`.
- Never call `requestPermissionsAsync()` on mount. Ask for permission only after a user action, e.g. tapping "Near me" on the map.
- Never propose a full rebuild for a JS-only change (copy, translations, styling, logic). Ship it with EAS Update.
- Never animate the opacity of a `GlassView` or its ancestors, and never clip it with `overflow-hidden`.

**RTL-specific conventions**
- Use logical spacing classes only: `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`. Do not use `ml-*`, `mr-*`, `left-*`, or `right-*` for layout.
- Use the `rtl:` and `ltr:` NativeWind variants for direction-specific tweaks.
- Numbers, prices, and phone numbers stay LTR inside RTL text. Wrap them with `<Num>` / `<Money>` (LTR + tabular figures).

---

## 3. Information Architecture & Routes (Expo Router)

```
app/
├── _layout.tsx                    # Root Stack: providers (i18n, nav theme, query), fonts, RTL bootstrap
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
│   ├── _layout.tsx                # NativeTabs (Liquid Glass on iOS 26, Material 3 on Android)
│   ├── explore/                   # each tab = folder with _layout.tsx (<TabStack>) + index.tsx
│   │   └── index.tsx              # MAP (default tab) + glass controls + bottom sheet listing list
│   ├── saved/index.tsx            # Saved properties (FlashList)
│   ├── mortgage/index.tsx         # Mortgage plans dashboard
│   ├── learn/index.tsx            # Learn hub: guides + glossary
│   └── profile/index.tsx          # Profile, language, appearance
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
│   ├── book.tsx                   # Native form sheet: book consultation (presentation: 'formSheet', detents)
│   └── confirmed.tsx
│
└── filters.tsx                    # Native form sheet: map filters (`@expo/ui` controls)
```

Supporting folders:
```
components/
├── ui/                # react-native-reusables copies + Glass, Icon (Button, Card, Badge, Chip, Input...)
├── navigation/        # TabStack (native stack + header config per tab)
├── map/               # PropertyMarker, ClusterMarker, MapFilterBar
├── property/          # PropertyCard, ScoreRing, ScoreBreakdown, AmenityList, DealsChart
├── mortgage/          # TrackRow, PlanCard, AmortizationChart, AffordabilityMeter
├── learn/             # ArticleCard, GlossaryRow
└── common/            # Num, Money, Screen, NebulaGlow, SectionHeader, EmptyState, Disclaimer
lib/
├── i18n/              # i18next setup, he.json, en.json
├── score/             # Potential Score engine (pure TS, unit-tested)
├── mortgage/          # Mortgage math + Israeli regulation config (pure TS, unit-tested)
├── tax/               # Purchase tax (מס רכישה) brackets by year
├── api/               # API client, query hooks
└── utils/
stores/                # Zustand stores
constants/             # theme tokens, icon registry, regulation config
global.css             # Tailwind directives
```

---

## 4. Features

### 4.1 Landing Page & Buyer Profile (Onboarding)

**Welcome / landing:** a hero illustration, the value proposition, a language toggle (עברית / English), and "Get started" and "I already have an account" buttons. **An account is required before anything else, including the map** (phone OTP, see `backend-spec.md` §5). The landing screen explains what the account gives (personal fit, affordability, alerts) before asking for the phone number. After sign-in the user can **"Skip the profile — just browse the map"**. The profile can be completed later. Mortgage plans, alerts, and consultation booking prompt for it.

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

- Full-screen `react-native-maps` (Apple Maps on iOS, Google Maps on Android) with **clustered** property markers (`supercluster`). Each marker is a glowing price pill colored by Potential Score band. Dark map style in dark mode.
- **Top bar:** floating `<Glass>` search pill (city / neighborhood / street) + glass filter button → `filters.tsx` form sheet.
- **Bottom sheet** (`@expo/ui` BottomSheet, native on both platforms) with 3 detents: peek (count + sort), half (FlashList of `PropertyCard`), full. Validate FlashList-inside-sheet in M2; fall back to `@gorhom/bottom-sheet` v5 only if the native sheet can't host it.
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
8. **Nearby houses & market.** Recent comparable deals (from government deals data), price per sqm trend chart (Victory Native XL, ion → plasma gradient line), and how this listing compares to the neighborhood average.
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
- Alerts: personalized notifications when a new property fits the user's profile (income, equity, buyer type, purchase tax), plus price drops on saved properties. The user picks channels (in-app, push, email, SMS, WhatsApp), frequency, and quiet hours. See `backend-spec.md` §9.
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
- Fonts with full Hebrew + Latin coverage: **Rubik** (primary, one family per weight: `font-sans`, `font-sans-medium|semibold|bold`). Loaded via `@expo-google-fonts/rubik` + `expo-font`. Native headers and tab labels use the same faces.
- Directional icons (chevrons, back arrows) mirror automatically (SF Symbols / Material Symbols are direction-aware); use `rtl:-scale-x-100` only for custom artwork.
- Translation copy changes ship through **EAS Update**, never a full build.
- All user-facing strings go through `t()`. No hard-coded text in components (lint rule).

---

## 7. Design System — "Orbit"

**Direction:** a premium, futuristic "spaceship cockpit" feel that still behaves 100% like a native app on each platform. Deep-space dark surfaces, light that comes from *within* the UI (ion-blue glows, translucent glass), precise typography, and physical, haptic motion. Think Apple Vision Pro / iOS 26 Liquid Glass meets a mission-control dashboard, not a sci-fi costume.

**Principles**
1. **Native first, then futuristic.** System tab bar (`NativeTabs`), native stack headers with large titles, native sheets (`@expo/ui` / `formSheet`) and native controls. The futuristic layer is color, light, glass, type and motion on top, never replacing platform behavior. (Avoid the "native slop" tells: floating pill tab bars, hand-rolled headers, web-style modals, emoji icons, cards-in-cards, heavy drop shadows, grey 1px borders everywhere.)
2. **Dark is the default ("deep space").** Light mode ("daylight") is fully supported and selectable in Profile → Appearance.
3. **Glass for what floats.** Anything layered over content (map search bar, map controls, mini property card, sticky CTA, sheets) uses `<Glass>`: Liquid Glass on iOS 26+, blurred material on older iOS/web, translucent tonal surface on Android, solid surface when Reduce Transparency is on.
4. **Light, not shadow.** Hierarchy comes from surface contrast and type. Elevation uses soft **colored glows** (`glows.primary`, `glows.plasma`) on a few hero elements only: primary CTA, score ring, selected map marker, empty-state icon.
5. **Big, precise numbers.** Prices, scores and payments are the heroes: bold, tabular figures (`<Num>`), small muted labels.
6. **Motion with purpose.** Spring physics via Reanimated 4, all on the UI thread. Score ring counts up and its glow pulses once on first view; map markers spring in; sheets follow the finger. Entrance animations only on first-time moments, never on every visit. Respect Reduce Motion.
7. **Feel it.** Haptics on primary actions (light impact), selections (selection tick), and success moments (booking confirmed).

**Signature moments**
- **Score ring:** Skia-rendered ion → plasma gradient arc with a soft glow, number counting up 0 → score.
- **Map:** dark map style at night / in dark mode, glowing price-pill markers colored by score band, 3D buildings tilt when zooming into a property (Apple Maps on iOS).
- **Hero gradient:** `gradients.ion` (`#6E7BFF → #3EE6FF`) reserved for the score ring, the primary CTA glow and onboarding hero. Never as a full-screen background.
- **Nebula backdrop:** a faint radial ion-blue glow behind the top of each screen (`<NebulaGlow>`).

**Tokens** (CSS variables in `global.css`, mirrored in `constants/theme.ts`):
| Token | Dark ("deep space") | Light ("daylight") | Use |
|---|---|---|---|
| `background` | `#05060B` | `#F6F7FB` | App background |
| `card` | `#0E101A` | `#FFFFFF` | Elevated surfaces |
| `secondary` / `muted` | `#161926` | `#ECEEF8` | Inputs, chips, subtle fills |
| `border` | `#222638` | `#DEE1EE` | Hairlines only |
| `foreground` / `muted-foreground` | `#F0F3FF` / `#8B93B0` | `#0A0C18` / `#626A84` | Text |
| `primary` ("ion") | `#6E7BFF` | `#4F5BFF` | CTAs, active tab, links, focus |
| `plasma` | `#3EE6FF` | `#00A8D6` | Secondary accent, gradients, live data |
| `tone-aurora` | `#0A2622` | `#DCF7EE` | Score / positive groups |
| `tone-solar` | `#2C1C0E` | `#FFEEE0` | Mortgage groups |
| `tone-nebula` | `#1C163C` | `#ECE9FF` | Learn / saved groups |
| `tone-ion` | `#0A1C34` | `#E2F0FF` | Map / amenities groups |
| `score-high` / `score-mid` / `score-low` | `#2EE6A6` / `#FFC24B` / `#FF5C7A` | `#05AA78` / `#D68C00` / `#E11D48` | Score rings, markers |
| `destructive` | `#FF5C7A` | `#E11D48` | Errors, destructive actions |
| Radius | `xl: 16`, `2xl: 24`, `3xl: 28`, `full` (+ `borderCurve: 'continuous'`) | | |
| Spacing | 4-pt scale; row gap < group gap < section gap | | |
| Type scale | Hero 44/bold · Display 32/bold · H1 24/semibold · H2 20/semibold · Body 16 · Caption 13 | | Rubik (Hebrew + Latin), tabular figures for numbers |

**Key components:** `Glass`, `Icon`, `NebulaGlow`, `ScoreRing`, `PropertyCard` (image top, price, chips, score badge), `StatTile`, `PlanCard`, `TrackRow`, `AffordabilityMeter`, `SectionHeader`, `StickyCTA` (glass), `Chip`, `TabStack`.

**Accessibility:** minimum 44×44 touch targets, WCAG AA contrast in both themes (verify glow/glass text contrast), `accessibilityLabel` on all icon buttons, Dynamic Type supported, Reduce Motion and Reduce Transparency respected, screen-reader order correct in RTL.

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
| Mortgage rates | Bank of Israel published average rates (no per-bank rates in v1) | Pulled by n8n (`backend-spec.md` §6) |

Data ingestion runs as **scheduled backend jobs**, not in the app. The app only calls the backend API.

---

## 9. Backend & Data Model

**Backend:** Supabase (Postgres + **PostGIS** + Auth + Edge Functions + Storage + Queues) with **self-hosted n8n** for data ingestion. The full backend spec is in **`backend-spec.md`** (source of truth for the backend). The entities below are the app-facing shapes.

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

- **Development builds** (`expo-dev-client`) are required because of `react-native-maps` config (Google Maps API key on Android) and native modules (`expo-glass-effect`, `@expo/ui`, Skia).
- Toolchain: always build with the Xcode and Android target API level the App Store / Google Play currently require. EAS Build images for the current SDK handle this. That is one reason the SDK must stay current (§2).
- EAS profiles: `development`, `preview` (internal testing), `production`.
- EAS Update channels: `preview`, `production`.
- **JS-only changes** (UI, copy, translations, score display logic, content) → `eas update`.
- **Native changes** (new native module, permissions, app config, SDK upgrade, map keys) → `eas build`.
- Secrets (Google Maps key, Supabase keys) go in EAS environment variables. They are never committed.

---

## 14. Milestones

| Phase | Scope |
|---|---|
| **M0: Foundation** ✅ | Expo SDK 57 + Expo Router + NativeWind v4.2, React Compiler, i18n + RTL bootstrap, "Orbit" design tokens, `/components/ui` base components (incl. `Glass`, `Icon`), native tabs + per-tab native stacks, EAS project |
| **M1: Onboarding & Profile** | Landing page, multi-step profile form, Zustand persistence, derived affordability |
| **M2: Map & Listings** | Map with clusters, bottom sheet FlashList, filters, listing page (with mock data) |
| **M3: Potential Score** | Score engine (server + `lib/score`), score card + deep-dive, plans / amenities / traffic sections |
| **M4: Mortgage** | Mortgage math lib + tests, 3 plans, plan detail with charts, total cost of purchase |
| **M5: Learn Hub** | Guides + glossary (HE/EN), search |
| **M6: Consultation** | Booking flow, leads backend, status tracking, CTAs across the app |
| **M6.5: Alerts** | Account + profile sync, alert & channel preferences, in-app inbox, push, then email / SMS / WhatsApp, "Why this fits you" card (backend: `backend-spec.md` §16 B5) |
| **M7: Real data & launch** | Data source integrations, privacy review, store submission |

---

## 15. Open Questions

1. ~~**Expo SDK version**~~ **Resolved (v0.2):** track the latest stable SDK (currently 57). See §2 version policy.
2. **Listing source:** Which brokers or partners will supply listings in v1? Or launch with a curated dataset in one city first (e.g. Tel Aviv / Ramat Gan / Haifa)?
3. ~~**Backend:**~~ **Resolved:** Supabase + PostGIS + self-hosted n8n. See `backend-spec.md`.
4. **Consultants:** In-house team or partner network? How are leads routed and monetized (fixed fee, referral, success fee)?
5. ~~**Authentication:**~~ **Resolved:** an account is required for everything, including the map. Sign-in by phone OTP (Twilio Verify). No anonymous browsing. App Store guideline 5.1.1 risk accepted, mitigation in `backend-spec.md` §5.
6. **Credit score:** Self-reported only, or integrate with a licensed credit bureau later?
7. **Additional languages:** Russian / French / Arabic in a later phase?
8. **Design:** "Orbit" direction adopted (§7). Produce a Figma file for the signature moments (score ring, map markers, property page) before M2–M3?
