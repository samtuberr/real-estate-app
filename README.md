# Nadlan Score

Bilingual (Hebrew / English) Expo app for home buyers in Israel. `spec.md` is the source of truth for scope, stack rules and architecture.

## Status

**M0 — Foundation** (spec §14): Expo SDK 57 (React Native 0.86, React 19.2, React Compiler) + Expo Router + NativeWind v4.2, i18n + RTL bootstrap, "Orbit" design tokens (dark-first), base UI components incl. Liquid Glass `Glass` and SF/Material `Icon`, native tabs with a native stack per tab, EAS config. Tab screens are placeholders for M1–M6.

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

## Layout

| Path | Contents |
|---|---|
| `app/` | Expo Router routes: root providers in `_layout.tsx`, `NativeTabs` in `(tabs)/_layout.tsx`, one folder per tab (`_layout.tsx` = `<TabStack>`, `index.tsx` = screen) |
| `components/ui/` | react-native-reusables-style primitives (Text, Button, Card, Badge, Chip, Input, Icon, Glass, Progress, Separator) |
| `components/common/` | `Num`, `Money`, `Screen`, `NebulaGlow`, `SectionHeader`, `StatTile`, `EmptyState`, `Disclaimer` |
| `components/navigation/` | `TabStack`: native stack + large-title header config shared by every tab |
| `lib/i18n/` | i18next setup, `he.json` / `en.json`, RTL direction + locale switching |
| `lib/utils/` | `cn()`, Intl formatting helpers |
| `stores/` | Zustand stores (`settings`: locale + theme, persisted via `expo-sqlite/localStorage`) |
| `global.css`, `tailwind.config.js`, `constants/theme.ts` | "Orbit" design tokens (dark default + light) and their JS mirror |
| `constants/icons.ts` | Icon registry: SF Symbol + Material Symbol per icon |

## Conventions

- Style with NativeWind `className` only; logical spacing (`ms-*`, `pe-*`, `start-*`), `rtl:` variants for direction tweaks.
- Use `font-sans-medium|semibold|bold` (Rubik faces), not `font-bold`.
- Wrap numbers, prices and phone numbers in `<Num>` / `<Money>` so they stay LTR.
- Every user-facing string goes through `t()`; keep `he.json` and `en.json` keys in sync (enforced by a test).
- Icons: `<Icon name="…" />`, registered in `constants/icons.ts`. Floating UI over content uses `<Glass>`.
- Never import `@react-navigation/*`; use `expo-router` (incl. `expo-router/react-navigation`). Install packages with `npx expo install`.
