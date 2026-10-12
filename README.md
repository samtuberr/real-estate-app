# Nadlan Score

Bilingual (Hebrew / English) Expo app for home buyers in Israel. `spec.md` is the source of truth for scope, stack rules and architecture.

## Status

**M0 — Foundation** (spec §14): Expo SDK 57 (React Native 0.86, React 19.2, React Compiler) + Expo Router + NativeWind v4.2, i18n + RTL bootstrap, "Orbit" design tokens (dark-first), base UI components incl. Liquid Glass `Glass` and SF/Material `Icon`, native tabs with a native stack per tab, EAS config. Tab screens are placeholders for M1–M6.

**M2 — Map & Listings**: full-screen map (`react-native-maps`, `supercluster` clusters, score-colored price pills), glass search / filters / "Near me", listing sheet (`@gorhom/bottom-sheet` + FlashList), filters form sheet (`@expo/ui` controls), listing page + full-screen gallery, Saved tab. Data comes from a deterministic mock behind the `lib/api` repository (swapped for Supabase in backend B2).

## Getting started

```bash
npm install
npx expo start            # press w for web
npm test                  # unit tests
npm run typecheck
```

Native features (RTL `supportsRTL`, Liquid Glass, `@expo/ui`, later `react-native-maps`) need a development build. Web is a quick preview only. The tab bar and glass are native-only:

```bash
eas init                                      # once — links the EAS project
eas build --profile development --platform ios|android
```

### Android Maps setup

The Explore screen mounts Google Maps at startup. Android builds without a Maps key crash with
`API key not found`; the development client's subsequent `Unable to pause activity` / view-parent
exception can hide that original error. Android prebuild now rejects a missing or blank key.

1. Create/select a [Google Cloud project](https://console.cloud.google.com/), link billing, and enable **Maps SDK for Android**.
2. Under **APIs & Services → Credentials**, create an API key. Restrict it to **Android apps** with package
   `com.nadlanscore.app` and the SHA-1 fingerprint of the certificate signing the APK. For EAS builds,
   find it in the Expo project dashboard under **Configure → Credentials → Android**. Restrict the API
   to **Maps SDK for Android**. Google Play builds may need their separate Play app-signing fingerprint.
3. In the Expo project dashboard under **Environment variables**, add `GOOGLE_MAPS_ANDROID_API_KEY`
   with the key as its value, **Sensitive** visibility, and the **development** environment for a development
   build. Configure it for preview/production before using those profiles; `eas.json` selects each environment explicitly.
4. Rebuild with `eas build --profile development --platform android` and install the new APK.
   Restarting Metro or publishing a JavaScript update cannot add the key to an existing APK.

For local Android builds, copy `.env.example` to `.env.local` and set the variable there. The config
injects it into native Android metadata; do not commit it or put it in `EXPO_PUBLIC_*`. Android app/API
restrictions matter because an embedded Maps key is extractable from the APK. iOS uses Apple Maps.

References: [Expo Maps setup](https://docs.expo.dev/versions/latest/sdk/map-view/#android),
[EAS environment variables](https://docs.expo.dev/eas/environment-variables/).

## Layout

| Path | Contents |
|---|---|
| `app/` | Expo Router routes: root providers in `_layout.tsx`, `NativeTabs` in `(tabs)/_layout.tsx`, one folder per tab (`_layout.tsx` = `<TabStack>`, `index.tsx` = screen) |
| `components/ui/` | react-native-reusables-style primitives (Text, Button, Card, Badge, Chip, Input, Icon, Glass, Progress, Separator) |
| `components/common/` | `Num`, `Money`, `Screen`, `NebulaGlow`, `SectionHeader`, `StatTile`, `EmptyState`, `Disclaimer` |
| `components/navigation/` | `TabStack`: native stack + large-title header config shared by every tab |
| `lib/i18n/` | i18next setup, `he.json` / `en.json`, RTL direction + locale switching |
| `lib/domain/` | Pure-TS shared domain: types, filters/sort, score grades (no RN/Expo imports — also runs in Edge Functions) |
| `lib/api/` | Repositories (`properties.ts`, mock data in `mock/`) and TanStack Query hooks (`queries.ts`) |
| `lib/map/` | Region math, clustering, "Near me" permission flow |
| `components/map/`, `components/property/` | Map markers, sheet, search; property card and listing-page sections |
| `lib/utils/` | `cn()`, Intl formatting helpers |
| `stores/` | Zustand stores persisted via `expo-sqlite/localStorage`: `settings` (locale, theme), `map` (region, filters, sort), `saved` |
| `global.css`, `tailwind.config.js`, `constants/theme.ts` | "Orbit" design tokens (dark default + light) and their JS mirror |
| `constants/icons.ts` | Icon registry: SF Symbol + Material Symbol per icon |

## Conventions

- Style with NativeWind `className` only; logical spacing (`ms-*`, `pe-*`, `start-*`), `rtl:` variants for direction tweaks.
- Use `font-sans-medium|semibold|bold` (Rubik faces), not `font-bold`.
- Wrap numbers, prices and phone numbers in `<Num>` / `<Money>` so they stay LTR.
- Every user-facing string goes through `t()`; keep `he.json` and `en.json` keys in sync (enforced by a test).
- Icons: `<Icon name="…" />`, registered in `constants/icons.ts`. Floating UI over content uses `<Glass>`.
- Never import `@react-navigation/*`; use `expo-router` (incl. `expo-router/react-navigation`). Install packages with `npx expo install`.
