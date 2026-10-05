# Backend Spec — Nadlan Score (Supabase + self-hosted n8n)

> Status: Draft v1.1 · 2026-10-05 · Owner: Sam Tuber
> Companion to `spec.md` (product) and `data-architecture.html` (decision record: n8n vs. server). This file is the source of truth for the backend. Read it before writing any migration, Edge Function, or n8n workflow.

---

## 1. Decisions (resolved)

| # | Topic | Decision |
|---|---|---|
| 1 | Backend platform | **Supabase Cloud**: Postgres + PostGIS, Auth, Storage, Edge Functions, Queues (pgmq), pg_cron, pg_net |
| 2 | n8n role | **n8n, self-hosted** (Docker on a VPS) has two jobs: (a) **ingestion** of external data, (b) **delivery of SMS and WhatsApp through Twilio**. n8n never reads user profiles and never decides who is notified, when, or what the message says |
| 3 | Business logic | Server-side, in **one shared pure-TS domain package** (`lib/domain`) used by the app, Edge Functions, and tests |
| 4 | Accounts | **An account is required for everything, including map browsing.** No anonymous access |
| 5 | Mortgage rates | Public averages only (Bank of Israel). No per-bank rates in v1 |
| 6 | Notification channels | **In-app, push, email** sent by the server; **SMS, WhatsApp** sent by n8n via **Twilio**. Each user chooses per channel |
| 7 | Legal | Privacy (Amendment 13) and anti-spam (Communications Law §30A) reviewed by the owner's lawyer before alerts launch |

**Core principle:** *n8n moves data in and delivers messages out. The server decides what the data means, who hears about it, and what they are told.*

---

## 2. System Overview

```
 External sources                 Self-hosted VPS                       Supabase Cloud
 ─────────────────                ───────────────                       ───────────────────────────────────────────
 Partner listing feeds ─┐
 nadlan.gov.il deals    │                                   ┌─► ingest.* RPCs (SECURITY DEFINER, validate, hash)
 iplan / GIS plans      ├──►  n8n (cron, HTTP, normalize) ──┤        │
 GTFS / NTA             │      role: n8n_ingest              │        ▼
 OSM Overpass           │                                    │   public.* clean tables ──► triggers ──► pgmq queues
 Bank of Israel rates  ─┘                                    │                                            │
                                                             │        pg_cron (every minute) ──► Edge Function workers
                                                             │                                  score · match · digest · dispatch
                                                             │                                            │
 Mobile app (Expo) ◄── PostgREST (RLS) / RPC / Edge Functions ◄──────────────────────────────────────────┤
                                                                                                          ▼
                                                    Expo Push · Email provider        delivery.* RPCs ◄── n8n ──► Twilio (SMS, WhatsApp)
```

| Component | Hosted on | Responsibility |
|---|---|---|
| Supabase Postgres | Supabase Cloud (Pro plan) | All data, PostGIS queries, RLS, triggers, queues, cron |
| Supabase Auth | Supabase Cloud | Phone OTP sign-in, sessions, JWT for RLS |
| Supabase Storage | Supabase Cloud | Property images, GTFS archives, user exports |
| Edge Functions (Deno) | Supabase Cloud | Workers, property detail API, account deletion, email provider webhooks |
| n8n | Self-hosted VPS (Docker Compose) | Scheduled ingestion from external sources; SMS / WhatsApp delivery via Twilio (§6.4) |
| Message providers | SaaS | Expo Push and email (called by the server); Twilio SMS + WhatsApp (called by n8n); Twilio Verify for OTP (called by Supabase Auth) |

**Region:** the closest EU region to Israel (e.g. Frankfurt). Confirm the cross-border transfer position with the lawyer.

---

## 3. Environments & Repository Layout

| Env | Supabase | n8n | App |
|---|---|---|---|
| `local` | `supabase start` (Docker) | local Docker, pointing at local DB | dev build, `.env.local` |
| `staging` | separate Supabase project | same VPS, separate n8n instance or separate credentials | EAS `preview` channel |
| `production` | separate Supabase project | production n8n | EAS `production` channel |

```
/lib/domain/                 # pure TS, NO react-native / expo / node imports
  types.ts                   # Property, PotentialScore, BuyerProfile, MatchResult, LocalizedText…
  score/  mortgage/  tax/  match/  regulation/
/lib/api/                    # app-side repositories (TanStack Query calls these)
/supabase/
  config.toml
  migrations/                # SQL migrations, the only way schema changes
  seed.sql                   # dev seed: one city, mock properties, configs
  functions/
    _shared/                 # supabase client, provider adapters, i18n templates
    worker-score/  worker-match/  worker-digest/  worker-dispatch/
    property-detail/  delete-account/  export-account/
    webhook-email/           # SMS / WhatsApp webhooks live in n8n (§6.4)
/n8n/
  workflows/*.json           # exported workflows (no credentials)
  docker-compose.yml  Caddyfile  .env.example
```

**Shared domain code rule.** Everything in `lib/domain` must run unchanged in Hermes (app), Deno (Edge Functions), and Jest. No platform imports, no `Date.now()` inside calculations (pass `now` in), no I/O.
**Spike in B0:** confirm how Edge Functions import `lib/domain` (import map in `supabase/functions/deno.json` pointing at `../../lib/domain`, or a pre-deploy copy into `_shared/domain`). Pick one and document it here.

**Types:** `supabase gen types typescript` → `lib/api/database.types.ts`, regenerated in CI on every migration.

---

## 4. Database Schemas

| Schema | Exposed through API | Contents |
|---|---|---|
| `public` | Yes (RLS on every table) | Properties, scores, plans, content, user profile, preferences, matches, in-app notifications |
| `ingest` | No | RPC functions callable by `n8n_ingest` only, `ingestion_runs`, optional `raw_payloads` |
| `delivery` | No | RPC functions callable by `n8n_delivery` only (§6.4) |
| `internal` | No | Outbox, consents log, configs history, worker state |
| `pgmq` | No | Queues |

### 4.1 Reference & market data (written by ingestion)

```sql
create table public.properties (
  id               uuid primary key default gen_random_uuid(),
  source           text not null,                 -- 'partner:<slug>' | 'admin'
  source_id        text not null,
  status           text not null check (status in ('active','sold','off_market')),
  price            integer not null check (price between 100000 and 100000000),
  location         geography(point, 4326) not null,
  city             text not null,
  neighborhood     text,
  street           text, house_number text,
  gush int, helka int,
  rooms            numeric(3,1) not null,
  size_sqm         integer not null,
  floor int, total_floors int,
  property_type    text not null,                 -- spec.md §9 enum
  features         jsonb not null default '{}',   -- elevator, parking, mamad, balcony, storage
  building_year    int,
  images           jsonb not null default '[]',   -- [{url, blurhash}]
  description      jsonb not null default '{}',   -- LocalizedText
  content_hash     text not null,                 -- hash of normalized fields → change detection
  first_seen_at    timestamptz not null default now(),
  last_seen_at     timestamptz not null default now(),
  price_history    jsonb not null default '[]',   -- [{price, at}]
  unique (source, source_id)
);
create index on public.properties using gist (location);
create index on public.properties (city, status, price);
```

Other ingestion tables follow the same pattern (`source`, `source_id`, unique key, `last_seen_at`):

| Table | Key columns |
|---|---|
| `deals` | `deal_date`, `price`, `size_sqm`, `rooms`, `location geography`, `city`, `neighborhood`, `gush/helka` |
| `city_plans` | `plan_number`, `name jsonb`, `status`, `type`, `geometry geography(multipolygon)`, `approved_at` |
| `transit_stops` | `kind` (bus/rail/light_rail/metro), `planned bool`, `location`, `line_refs` |
| `pois` | `category`, `name`, `location` |
| `stat_areas` | CBS statistical area polygon + socio-economic cluster |
| `mortgage_rates` | `track_type`, `term_bucket`, `rate`, `period` (month), `source`, `published_at` |
| `macro_rates` | `boi_rate`, `prime` (= BoI + 1.5%), `cpi_yoy`, `effective_from` |

### 4.2 Derived data (written by the server only)

| Table / view | Contents |
|---|---|
| `neighborhood_market_stats` (materialized view) | Median price/sqm, 1/3/5-year trend, deal count per neighborhood. Refreshed after deal ingestion |
| `property_scores` | `property_id`, `algorithm_version`, `total`, `grade`, `confidence`, `sub_scores jsonb`, `computed_at`. PK `(property_id, algorithm_version)` |
| `property_context` | Cached inputs per property (nearby plans, stops, POI counts, comparable deals) used by the detail page and the score |

### 4.3 Configuration (admin-maintained, versioned)

| Table | Contents |
|---|---|
| `regulation_config` | Max LTV per buyer type, max payment-to-income, track-mix limits, max term. `version`, `effective_from` |
| `tax_brackets` | `year`, `buyer_type`, `brackets jsonb` (purchase tax, מס רכישה). Updated every January |
| `score_config` | Weights and thresholds per `algorithm_version` (spec.md §5) |
| `system_config` | Notification caps, quiet hours defaults, digest times, price tolerance for matching |

Any change to a config row is logged to `internal.config_audit` (who, when, before, after) and emits a recompute event (§8).

### 4.4 User data

```sql
create table public.buyer_profiles (
  user_id              uuid primary key references auth.users on delete cascade,
  household_type       text not null,
  members              jsonb not null,        -- [{netMonthlyIncome, employment}] — names/ages optional
  children             int,
  monthly_obligations  integer not null,
  initial_equity       integer not null,
  additional_help      integer,
  ownership            text not null,
  first_apartment      boolean not null,
  subsidized_eligible  text,
  bank                 text not null,
  credit_score_range   text not null,
  stage                text not null,
  target_cities        text[] not null default '{}',
  budget_min int, budget_max int, rooms_min numeric, rooms_max numeric,
  property_types       text[],
  purpose              text not null,
  locale               text not null default 'he',
  server_sync_consent  boolean not null,      -- profile is only stored here if true
  updated_at           timestamptz not null default now()
);

create table public.buyer_derived (          -- written only by worker-match
  user_id              uuid primary key references auth.users on delete cascade,
  buyer_type           text not null,         -- first_home | upgrader | investor
  max_ltv              numeric not null,
  available_cash       integer not null,      -- equity + help
  max_monthly_payment  integer not null,
  max_loan             integer not null,
  max_price            integer not null,      -- after purchase tax and closing costs
  engine_version       text not null,
  rates_period         text not null,
  regulation_version   text not null,
  tax_year             int not null,
  computed_at          timestamptz not null default now()
);
```

| Table | Contents |
|---|---|
| `alert_preferences` | One row per user: `enabled`, `cities text[]`, `area geography` (optional drawn area), `rooms_min/max`, `property_types`, `min_score`, `include_price_drops`, `include_newly_affordable` |
| `channel_preferences` | `(user_id, channel)` → `enabled`, `frequency` (`instant` / `daily` / `weekly` / `off`), `max_per_day`, `address` (email/phone if different from auth), `verified_at` |
| `quiet_hours` | `start`, `end`, `observe_shabbat` (default true), `timezone` (default `Asia/Jerusalem`) |
| `push_tokens` | `user_id`, `expo_token`, `platform`, `last_used_at`, `disabled_at` |
| `saved_properties` | `user_id`, `property_id`, `created_at` |
| `matches` | `user_id`, `property_id`, `engine_version`, `monthly_payment`, `equity_gap`, `payment_to_income`, `purchase_tax`, `reasons jsonb`, `created_at`. Unique `(user_id, property_id)`; updated on re-match |
| `notifications` | In-app inbox: `user_id`, `type`, `title jsonb`, `body jsonb`, `property_id`, `deep_link`, `read_at`, `created_at` |
| `leads` | spec.md §9 `Lead` |
| `internal.consents` | Append-only: `user_id`, `type` (`privacy`, `server_profile`, `marketing_email`, `marketing_sms`, `marketing_whatsapp`, `share_with_expert`), `granted bool`, `text_version`, `source`, `ip/device`, `at`. Evidence for anti-spam and privacy law |
| `internal.notification_outbox` | `id`, `user_id`, `channel`, `template_key`, `payload jsonb`, `dedupe_key`, `status` (`pending`/`held`/`claimed`/`sent`/`delivered`/`failed`/`skipped`), `claimed_at`, `send_after`, `attempts`, `provider_message_id`, `error`, timestamps. Unique `dedupe_key` |

---

## 5. Authentication

- **Required account, no anonymous access.** Every screen, including the map, needs a signed-in user. Sign-in by **phone OTP** (Supabase Auth phone provider). Reasons: SMS and WhatsApp alerts need a verified phone anyway, phone is the norm in Israel, and leads need a phone number.
- **OTP provider = Twilio** (Supabase Auth's built-in Twilio / Twilio Verify integration), configured directly in Supabase. OTP does **not** go through n8n: sign-in must not depend on the VPS being up.
- **Email** is optional and verified with an OTP before the email channel can be enabled.
- **Apple / Google sign-in:** not in v1. If added later, Sign in with Apple must be offered on iOS.
- **Session storage** in the app follows the Supabase Expo guide, using `expo-sqlite/localStorage` (spec.md §2 persistence rule).
- **Account deletion in-app** (App Store requirement): `delete-account` Edge Function deletes the auth user (cascades) and purges outbox rows, consents are kept only as long as the lawyer says is required.
- **App Store risk (accepted).** Apple guideline 5.1.1 discourages forcing registration for features that don't need an account. Mitigation: the landing screen explains the value of the account (personal score fit, affordability, alerts) before asking for the phone number, and the review notes include a demo account. If review still rejects, the fallback is a read-only public map: one RLS policy change (§11), no schema change.

---

## 6. n8n Contracts (ingestion + delivery)

### 6.1 Access
- n8n connects to Postgres through the Supabase connection pooler over TLS as role **`n8n_ingest`**.
- `n8n_ingest` has **EXECUTE on `ingest.*` functions only**. No direct table privileges. No access to `auth`, user tables, or `internal`.
- n8n never uses the `service_role` key.

### 6.2 Ingest functions
Each function is `SECURITY DEFINER`, takes a JSON batch (≤ 500 rows), validates every row, and returns `{inserted, updated, unchanged, rejected: [{source_id, reason}]}`.

| Function | Notes |
|---|---|
| `ingest.start_run(source text) → run_id` | Opens a row in `ingest.ingestion_runs` |
| `ingest.upsert_properties(run_id, rows jsonb)` | Computes `content_hash`. Unchanged → only `last_seen_at`. New → `property.created`. Lower price → append to `price_history` + `property.price_dropped`. Other change → `property.updated` |
| `ingest.mark_missing_properties(run_id, source)` | Rows not seen for N runs of a full-snapshot feed → `off_market` + `property.removed` |
| `ingest.upsert_deals(run_id, rows)` | After the run: refresh `neighborhood_market_stats` |
| `ingest.upsert_city_plans(run_id, rows)` | Geometry as GeoJSON → `ST_GeomFromGeoJSON` |
| `ingest.upsert_transit_stops`, `ingest.upsert_pois`, `ingest.upsert_stat_areas` | |
| `ingest.upsert_mortgage_rates(run_id, rows)` | If the latest period changes → `rates.changed` |
| `ingest.upsert_macro_rates(run_id, rows)` | BoI rate / prime / CPI change → `rates.changed` |
| `ingest.finish_run(run_id, status, error)` | Closes the run, records counts |

**Validation examples:** coordinates inside Israel's bounding box, price and size in sane ranges, price/sqm within 5× the neighborhood median (else `rejected` with reason), known enum values.

### 6.3 Workflows (n8n)

| Workflow | Schedule | Notes |
|---|---|---|
| `listings-<partner>` | every 15–60 min (per partner) | Map feed → `Property`, geocode if needed, upload images to Storage, `upsert_properties` |
| `deals-nadlan` | weekly | Pagination, normalization |
| `plans-iplan` | weekly | ArcGIS REST → GeoJSON |
| `transit-gtfs` | monthly | Download zip to Storage; stop parsing may move to a server script if too heavy for n8n |
| `pois-osm` | monthly, per city | Overpass query, category mapping |
| `rates-boi` | daily check (data changes monthly; BoI rate on decision days) | Mortgage average rates by track + BoI rate |
| `cpi-cbs` | monthly | CPI |
| `stat-areas-cbs` | yearly / manual | |
| `_error-handler` | on error | Telegram/email to admin. Admin data only, never user data |

**n8n rules:** idempotent upserts only; no business logic (scores, trends, affordability); ingestion workflows never touch user data; workflows exported to `n8n/workflows/` on every change; Yad2 / Madlan scraping is forbidden (spec.md §8).

### 6.4 Delivery contract (SMS + WhatsApp via Twilio)

The server does everything up to "this exact message should go to this phone now". n8n only sends it and reports back.

**Access.** A second DB role, **`n8n_delivery`**, with EXECUTE on `delivery.*` functions only. Separate n8n credentials from `n8n_ingest`. No table privileges.

| Function | Behavior |
|---|---|
| `delivery.claim(channel text, max int) → setof message` | Atomically claims due rows (`status = 'pending'`, `send_after <= now()`, channel = `sms`/`whatsapp`) with `FOR UPDATE SKIP LOCKED`, **re-checks consent and opt-out at claim time**, sets `claimed`. Returns only `{id, to_e164, body}` for SMS or `{id, to_e164, content_sid, content_variables}` for WhatsApp |
| `delivery.report(id, ok bool, twilio_sid text, error_code text)` | `sent` or back to `pending` with backoff; after 5 attempts → `failed` |
| `delivery.status_callback(twilio_sid, status, error_code)` | Twilio delivery status (`delivered`, `undelivered`, `failed`) |
| `delivery.opt_out(from_e164, channel, keyword)` | Inbound "הסר" / STOP / ביטול → revokes the consent row and the channel preference |
| `delivery.opt_in(from_e164, channel, keyword)` | Inbound START (WhatsApp re-subscribe) when the user had previously consented |

Claimed rows not reported within 10 minutes return to `pending` (reaper in `worker-dispatch`), so a crashed n8n run doesn't lose messages. Duplicate sends are prevented by the `dedupe_key` + claim.

**Workflows.**

| Workflow | Trigger | Steps |
|---|---|---|
| `deliver-sms` | every minute | `delivery.claim('sms', 50)` → Twilio node (Messaging Service SID, alphanumeric sender name) → `delivery.report` |
| `deliver-whatsapp` | every minute | `delivery.claim('whatsapp', 50)` → Twilio WhatsApp with approved **Content template** (`content_sid` + variables) → `delivery.report` |
| `twilio-status` | webhook (Twilio status callback) | Verify `X-Twilio-Signature` → `delivery.status_callback` |
| `twilio-inbound` | webhook (incoming SMS / WhatsApp) | Verify signature → match opt-out / opt-in keywords → `delivery.opt_out` / `opt_in`. Any other text gets an auto-reply pointing to the app; message bodies are not stored |

**What the server guarantees before a row is claimable:** consent + verified phone, dedupe, frequency (digest), quiet hours / Shabbat, daily cap, rendered text in the user's locale, removal instructions appended (SMS), approved template mapped (WhatsApp).

**Message content rule.** SMS and WhatsApp bodies contain **no personal financial data** (no income, equity, monthly payment, or credit range). Only property facts and a deep link, e.g. *"נכס חדש שמתאים לך: 4 חד׳ ברמת גן, 2.4 מ׳ ₪. לפרטים: <link>. להסרה השב הסר"*. The personal numbers are shown in the app after sign-in. This keeps n8n, Twilio logs, and lock screens free of sensitive data.

**n8n settings for delivery workflows:** "Save successful production executions" = off, "Save execution progress" = off, error executions pruned after 7 days. Twilio credentials live only in n8n.

---

## 7. Shared Domain Engine (`lib/domain`)

| Module | Main function | Used by |
|---|---|---|
| `score` | `computeScore(inputs, config) → PotentialScore` | `worker-score`, app previews, tests |
| `mortgage` | `buildPlans(profile, loan, rates, regulation)`, `monthlyPayment(track)` | Mortgage tab, `worker-match` |
| `tax` | `purchaseTax(price, buyerType, brackets)` | Total cost screen, `worker-match` |
| `regulation` | `buyerType(profile)`, `maxLtv(...)`, `maxMonthlyPayment(...)` | Everywhere |
| `match` | `deriveBuyer(profile, ctx) → BuyerDerived`, `evaluateMatch(profile, derived, property, ctx) → MatchResult` | `worker-match`, property page "Why this fits you" card |

Every output carries `engineVersion`. The property page shows the stored match (from `matches`) when it exists, and recomputes locally only when the user edits values. **The numbers in a notification and the numbers on the screen must come from the same function and inputs.**

`MatchResult` is defined in `data-architecture.html` §6.

---

## 8. Event Pipeline

### 8.1 Queues (pgmq)

| Queue | Messages | Producer |
|---|---|---|
| `property_events` | `property.created`, `property.updated`, `property.price_dropped`, `property.removed` | ingest functions |
| `buyer_events` | `profile.updated`, `preferences.updated` | triggers on user tables |
| `global_events` | `rates.changed`, `config.changed`, `tax.changed`, `score_config.changed` | ingest functions, config triggers |
| `outbox_ready` | outbox ids | `worker-match`, `worker-digest` |

### 8.2 Workers (Edge Functions, invoked by pg_cron via pg_net every minute; each drains a batch)

| Worker | Reads | Does |
|---|---|---|
| `worker-score` | `property_events` | Builds inputs from PostGIS (`property_context`), runs `computeScore`, upserts `property_scores`, then forwards the event to matching |
| `worker-match` | scored property events, `buyer_events`, `global_events` | **Property event:** SQL pre-filter → `evaluateMatch` per candidate → `matches` → outbox rows per enabled channel. **Buyer event:** recompute `buyer_derived`, refresh that user's `matches` (no notification). **Global event:** recompute `buyer_derived` for all users in batches, then queue "newly affordable" items for digests only |
| `worker-digest` | cron at 09:00 daily and Sunday 09:00 weekly (Asia/Jerusalem) | Groups `held` outbox items per user/channel into one digest message |
| `worker-dispatch` | `outbox_ready` + due `pending` rows | Applies send rules (§9.3) and renders the template for all channels. **Sends in-app, push, and email itself.** SMS / WhatsApp rows are left `pending` (ready) for n8n to claim (§6.4). Also reaps stale `claimed` rows |
| `worker-push-receipts` | cron every 15 min | Checks Expo push receipts, disables `DeviceNotRegistered` tokens |

**Reliability:** visibility timeout 60 s; max 5 attempts with backoff; then the message is archived (dead letter) and the admin is alerted. All workers are idempotent (unique keys on `matches` and `dedupe_key`).

### 8.3 Pre-filter (stage 1)

```sql
select d.user_id
from buyer_derived d
join alert_preferences a using (user_id)
where a.enabled
  and (cardinality(a.cities) = 0 or :city = any(a.cities))
  and (a.area is null or ST_Covers(a.area, :location))
  and :rooms between coalesce(a.rooms_min, 0) and coalesce(a.rooms_max, 99)
  and (a.property_types is null or :type = any(a.property_types))
  and :price <= d.max_price * (1 + :tolerance)      -- system_config, default 0.05
  and coalesce(:score, 0) >= coalesce(a.min_score, 0);
```

Stage 2 (`evaluateMatch`) decides eligibility precisely and produces the reasons.

---

## 9. Notifications

### 9.1 Channels

| Channel | Provider (to choose) | Cost | Notes |
|---|---|---|---|
| In-app inbox | `public.notifications` | Free | Always on. Every notification lands here, whatever other channels do |
| Push | Expo Push Service (`expo-notifications`) | Free | Requires OS permission, asked only after the user enables alerts (spec.md §11) |
| Email | Resend or Amazon SES | Very low | Verified email, `List-Unsubscribe` header, RTL HTML template |
| SMS | **Twilio** Messaging Service, sent by **n8n** (§6.4) | Per message segment (Hebrew = UCS-2, 70 chars per segment) | Alphanumeric sender name (check Israel sender registration rules in Twilio), removal instructions in every message |
| WhatsApp | **Twilio WhatsApp** (Twilio as Meta BSP), sent by **n8n** (§6.4) | Meta per-message fee (marketing category) + Twilio fee | Business-initiated messages need **WhatsApp-approved Content templates** (Twilio Content API) and WhatsApp opt-in. Requires Meta Business verification and a WhatsApp sender number |

In-app, push, and email are adapters in `supabase/functions/_shared/channels/` with one interface: `send(to, renderedMessage) → {providerMessageId}`. SMS and WhatsApp have no server adapter; the server's job ends at a claimable outbox row.

**Hebrew SMS length:** keep templates ≤ 140 characters (2 segments) including the link and removal text. Use a short link domain.

### 9.2 Notification types

| Type | Trigger | Default channels |
|---|---|---|
| `new_match` | New property matches profile + alert preferences | in-app + push (instant) |
| `price_drop_saved` | Price drop on a saved property | in-app + push (instant) |
| `back_in_range` | Price drop brings a property under the user's `max_price` | in-app + push |
| `newly_affordable` | Rates / tax / profile change makes more properties affordable | in-app + digest only |
| `saved_removed` | Saved property sold / off market | in-app only |
| `lead_update` | Consultation status changed | in-app + push (transactional, not marketing) |

### 9.3 Send rules (applied by `worker-dispatch`, in this order)

1. **Consent:** the channel must have an active consent row (`internal.consents`) and a verified address. Otherwise → `skipped`.
2. **Dedupe:** `dedupe_key = user:property:type` (per channel). Already sent → `skipped`.
3. **Frequency:** channel set to `daily` / `weekly` → `held` for the digest.
4. **Quiet hours & Shabbat:** inside the window → `send_after` = end of window (Shabbat and holidays use a holiday calendar table; v1 can use a fixed Friday 15:00 – Saturday 21:00 window).
5. **Daily cap:** instant sends today ≥ the channel's `max_per_day` → `held` for the next digest.
6. Send, record the result, retry transient errors.

**Default caps (`system_config`, user-editable within limits):**

| Channel | Default frequency | Default instant cap / day | Why |
|---|---|---|---|
| In-app | instant | unlimited | No interruption, no cost |
| Push | instant | 5 | Alert fatigue makes users turn push off at the OS level, and that can't be undone from the app |
| WhatsApp | daily digest | 2 | Cost per message, anti-spam law, and Meta quality rating (blocks/reports can restrict the number) |
| SMS | daily digest | 2 | Cost per message, anti-spam law |
| Email | daily digest | 3 | Spam folder reputation |

Lead updates (`lead_update`) are transactional and don't count toward caps.

### 9.4 Content
- Templates in `notification_templates (key, channel, locale, body, provider_template_id)`, Hebrew and English. For WhatsApp, `provider_template_id` is the Twilio Content SID of the approved template, and `body` is kept only for preview.
- Every alert in-app, push, and email includes: why it matched (top 2 reasons), the estimated monthly payment, the disclaimer ("an estimate, not loan approval"), a deep link to `property/[id]`, and an unsubscribe / settings option.
- SMS and WhatsApp follow the content rule in §6.4 (no personal financial data).
- Marketing messages on SMS / email / WhatsApp include sender identity and a removal method (Communications Law §30A). Final wording approved by the lawyer.

---

## 10. API Surface (for the app)

| spec.md §9 endpoint | Implementation |
|---|---|
| `GET /properties?bbox=&filters=` | RPC `properties_in_bbox(min_lng, min_lat, max_lng, max_lat, filters jsonb, limit)` → light rows (`id, location, price, rooms, size, type, score_total, thumbnail`). Clustering on the client (`supercluster`) in v1 |
| `GET /properties/:id` | Edge Function `property-detail` → property + score + context (plans, stops, POIs, comparable deals, market stats) + the user's match if any |
| `GET /plans?bbox=` | RPC `plans_in_bbox(...)` → simplified GeoJSON |
| `GET /content/learn`, `/content/glossary` | Tables `learn_articles`, `glossary_terms` (public read) |
| `GET /mortgage/rates` | View `current_rates` (latest period per track + macro rates), app falls back to bundled defaults |
| `POST/PATCH /profile` | Upsert `buyer_profiles` (RLS: own row), only when `server_sync_consent` |
| Matches | View `my_matches` (joins property + score), RLS own rows |
| Notifications | `notifications` select/update `read_at` (own rows); RPC `register_push_token(token, platform)` |
| Preferences | `alert_preferences`, `channel_preferences`, `quiet_hours` (own rows); RPC `set_consent(type, granted, text_version)` |
| `POST /leads`, `GET /leads/mine` | `leads` insert + select own rows |
| Account | Edge Functions `export-account`, `delete-account` |

App side: everything goes through `lib/api/*` repositories → TanStack Query. Components never call Supabase directly.

---

## 11. Row Level Security

| Table group | anon | authenticated | n8n_ingest | n8n_delivery | workers (service role) |
|---|---|---|---|---|---|
| properties, scores, plans, stops, POIs, market stats, content, current rates | none | read | via `ingest.*` only | none | read/write |
| configs (`regulation_config`, `tax_brackets`, `score_config`) | none | read | none | none | read |
| buyer_profiles, buyer_derived, matches, preferences, push_tokens, saved, notifications, leads | none | **own rows only** (`user_id = auth.uid()`); `buyer_derived` and `matches` read-only | **none** | **none** | read/write |
| `internal.*` (incl. outbox), `ingest.*`, `delivery.*` | none | none | `ingest.*` functions only | `delivery.*` functions only | read/write |

The `anon` role has no access to anything (account required, §5). Only Supabase Auth endpoints are reachable without a session.

Admin: a `public.admins` table + `is_admin()` function; admin writes to config tables go through RPCs that log to `internal.config_audit`. v1 admin UI = Supabase Studio.

---

## 12. Security & Privacy

- **Minimization:** matching needs incomes, obligations, equity, ownership, bank, credit range, preferences. Names and ages are optional and never used by workers.
- **Logging:** never log profile fields or message bodies. Workers log ids and counts only.
- **What n8n sees:** ingestion data (public) and, for delivery, only `{id, phone, rendered text}` of due SMS / WhatsApp messages, which by rule contain no personal financial data (§6.4). Successful delivery executions are not saved.
- **Secrets:** provider keys in Supabase Edge Function secrets; n8n credentials in n8n's encrypted store; app keys in EAS env vars (spec.md §13).
- **At rest / in transit:** Supabase disk encryption + TLS everywhere, including n8n → Postgres.
- **Retention:** outbox rows purged after 90 days; `matches` for off-market properties purged after 180 days; consents kept per legal advice.
- **Export / delete:** cover `buyer_profiles`, `buyer_derived`, `matches`, `notifications`, outbox, preferences, push tokens, saved, leads.
- **Profile without server consent:** the app keeps the profile locally (spec.md §10) and the user gets filter-based alerts only (no affordability).
- **Lawyer checklist:** Amendment 13 obligations (database registration / notification, security procedures level), cross-border storage (EU), consent texts, anti-spam wording, WhatsApp opt-in text, sharing with consultants, Twilio and n8n VPS as data processors (DPA with Twilio; VPS location).

---

## 13. Self-hosted n8n Operations

| Topic | Rule |
|---|---|
| Host | Small VPS (2 vCPU / 4 GB is enough to start), Docker Compose: `n8n` + its own `postgres` (n8n's internal DB, not Supabase) + `caddy` (TLS) |
| Access | Editor UI not open to the internet: behind Tailscale / VPN or an IP allowlist, plus n8n user auth with 2FA |
| Webhooks | Partner push feeds (secret header) and Twilio status / inbound (verify `X-Twilio-Signature`). Only `/webhook/*` paths are public through Caddy; the editor is not |
| Keys | `N8N_ENCRYPTION_KEY` backed up outside the VPS. Losing it loses all credentials |
| Executions | Prune executions (e.g. keep 14 days); don't save data of successful runs for large feeds |
| Backups | Nightly dump of the n8n Postgres + workflow export to git |
| Updates | Update n8n monthly (security fixes), test on staging first |
| Monitoring | Uptime check on the n8n health endpoint; `_error-handler` workflow; a server check that alerts if a source's last successful `ingestion_runs` row is older than 2× its schedule; **a server check that alerts if any SMS / WhatsApp outbox row is due and unclaimed for more than 5 minutes** (n8n down) |
| Availability | n8n is now on the alert path for SMS / WhatsApp. If it's down, those messages wait in the outbox and are sent when it recovers; in-app, push, and email are unaffected. OTP never depends on n8n |

---

## 14. Observability

- `ingest.ingestion_runs` → admin view "data freshness per source".
- Queue depth and dead-letter count per queue (SQL view) → alert if above threshold.
- Outbox stats per channel: sent / failed / skipped / held per day.
- Edge Function logs (Supabase) + optional Sentry.
- The app shows "updated X hours ago" for listings using the latest run per source.

---

## 15. Costs (estimates, verify before committing)

| Item | Estimate |
|---|---|
| Supabase Pro (per project; staging can be on Free or a smaller project) | ~$25/month + compute/usage |
| VPS for n8n | ~$5–20/month |
| Expo Push | Free |
| Email | Free tier → low |
| Twilio SMS (OTP via Verify + alerts) | Per segment to Israel + Verify fee per OTP: check current Twilio pricing |
| Twilio WhatsApp | Meta per-message fee (marketing / utility) + Twilio per-message fee: check current pricing for Israel |
| Google APIs (Maps Android key, Routes if used) | Usage-based |

Defaulting paid channels to daily digests (§9.3) is the main cost control.

---

## 16. Backend Milestones

Mapped to `spec.md` §14.

| Phase | Scope | With app milestone |
|---|---|---|
| **B0: Setup** | Supabase projects (local/staging/prod), migrations + type generation in CI, `lib/domain` import spike for Edge Functions, n8n VPS + Caddy + backups, Twilio account + Israeli sender registration, start Meta Business verification for WhatsApp (takes time) | Before M1 |
| **B1: Auth & profile** | Phone OTP via Twilio Verify, all tables closed to `anon`, `buyer_profiles`, consents, account delete/export | M1 |
| **B2: Properties & geo API** | Properties/plans tables, `properties_in_bbox`, `property-detail`, seed one city, swap the M2 mock repository for Supabase | M2 |
| **B3: Score pipeline** | Ingest functions, queues, `worker-score`, market stats view, first n8n workflows (deals, plans, OSM) | M3 |
| **B4: Rates & affordability** | `rates-boi` + `cpi-cbs` workflows, regulation/tax config, `buyer_derived` | M4 |
| **B5: Matching & alerts** | `worker-match`, outbox, `worker-dispatch`, in-app + push first; then email; then SMS and WhatsApp through n8n + Twilio (`delivery.*`, four workflows, after templates are approved and the lawyer signs off); preferences screens | New **M6.5: Alerts** |
| **B6: Leads** | `leads`, partner/CRM notification, status tracking | M6 |
| **B7: Real feeds & hardening** | Partner feed workflows, load test (10k users × 1k new properties/day), monitoring, security review | M7 |

---

## 17. Open Questions

1. **Listing partners:** which feeds, which format (pull API, file drop, push webhook), and update frequency?
2. ~~**SMS / WhatsApp providers**~~ **Resolved:** Twilio, sent by n8n (§6.4). OTP via Twilio Verify in Supabase Auth.
3. ~~**Anonymous browsing**~~ **Resolved:** no. Account required everywhere (§5).
4. **Holiday calendar:** fixed Shabbat window in v1, or a full Jewish holiday calendar from the start?
5. **Admin UI:** Supabase Studio is enough for v1. When do we need a real admin panel (consultants, leads, configs)?
6. **WhatsApp number:** a new dedicated number for the WhatsApp sender, or an existing business number?
