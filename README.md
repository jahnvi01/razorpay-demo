# Udhaar Suite

**Give credit safely, get paid on time.** A mobile-first web app (PWA) for small Indian merchants, built on the Razorpay ecosystem. A shopkeeper records udhaar (credit) in seconds, the customer gets a Razorpay payment link by SMS or WhatsApp, reminders go out on time, and the balance clears itself when the customer pays.

**Live demo:** https://udhaar-suite.vercel.app (no login; everyone shares one demo shop, Ramesh Kirana)

**Product docs:** [MVP definition](udhaar-suite-mvp-definition.md) · [Build roadmap](udhaar-suite-build-roadmap.md) · [Kanban board](BOARD.md) · [Pilot script](PILOT.md)

---

## Features

### For the merchant
- **Record udhaar in about 10 seconds:** pick or add a customer, enter the amount, keep the default 7-day due date, save
- **Home summary:** udhaar given, collected and remaining for this month, last month or a custom range
- **Dues list:** everyone who owes money, sorted by amount or most recent, with an Overdue filter, late badges and when each customer was last reminded
- **One tap reminders:** SMS the pay link to all overdue customers at once from a review sheet
- **Remind on WhatsApp or SMS:** WhatsApp opens the merchant's own WhatsApp with the message prefilled, and SMS goes out through Razorpay's payment link SMS
- **Trust Meter:** how each customer usually pays, shown on their screen and before giving more udhaar
- **Recovery Forecast:** how much is expected back this month, and who is On time, Likely late or At risk, each with a remind action
- **Push notifications:** a 10 am digest of who to chase (with Remind all) and an alert when a customer pays
- **Low network support:** screens open and new entries save without signal, then sync by themselves
- **English and हिंदी**, switchable from the header

### For the customer
- **Razorpay payment link** by SMS, payable by UPI, cards or netbanking
- **Statement page** (`/s/<token>`) showing what they owe and their payment history, without needing to log in

---

## Technical features

- **Trust Meter** (`lib/trust.ts`)
  - Computed from cleared entries: on-time rate, average days to pay, current due and oldest unpaid
  - Labels: 80% or more on time is "Usually on time", 50–79% is "Sometimes late", under 50% is "Often late"
  - Needs at least 3 cleared entries
  - Pure functions, unit tested
  - Shown as an animated score ring on a card tinted to match the label
- **Recovery Forecast** (`lib/data/forecast.ts`)
  - At risk: 30+ days late, or 7+ days late and often late. Likely late: late now, or usually pays late. On time: everyone else
  - Each customer's chance of paying is the average of the shop's 90-day recovery rate and the customer's own on-time rate, weighted 1 for On time, 0.85 for Likely late and 0.5 for At risk
- **Offline support with IndexedDB** (`lib/offline/outbox.ts`, `components/offline-sync.tsx`, `app/api/sync`)
  - Udhaar and cash entries made offline, or that hit a network error, are queued in an IndexedDB outbox
  - The outbox syncs automatically when the phone is back online, retrying after 5, 15, 30 and 60 seconds
  - `apply_sync_op` is idempotent on an operation ID, so retries never create duplicates. It keeps the phone's timestamp, clamped to the last 30 days and never in the future
  - A header strip shows waiting, syncing and synced states. Queued items appear on the customer's screen
- **PWA with Serwist** (`app/sw.ts`)
  - Installable to the home screen
  - App screens use NetworkFirst with a 4-second timeout, falling back to the cached copy. API calls are network-only
  - Key screens are cached ahead of time, so they open offline
- **Web Push with VAPID** (`lib/push.ts`, `app/api/push`)
  - Subscriptions are stored per shop with their language
  - The digest is sent from the daily cron and skipped on days with nothing to act on
  - The payment alert is sent only when a payment is newly recorded
  - Subscriptions the push service reports as gone (404 or 410) are deleted
- **Oldest-first clearing**
  - Each payment is allocated to the oldest open entries first. A database trigger keeps each entry's remaining balance and status in step with its allocations
  - Money is stored as integer paise throughout
- **Razorpay integration** (`lib/razorpay`, `lib/payments`)
  - One payment link per customer, covering their whole balance. It's refreshed whenever the balance changes
  - Signed webhooks, idempotent on the Razorpay payment ID
  - Payment status is also synced when a screen opens, so local testing works without a tunnel
  - A nightly ledger check compares the ledger with Razorpay and reports payments missing from the ledger
- **Realtime updates:** open screens update when a payment lands, through Supabase Realtime broadcast with a polling fallback
- **Day-before reminders:** a Vercel Cron job at 10:00 IST sends one Razorpay SMS per customer with udhaar due tomorrow
- **Bulk SMS** (`app/app/share-actions.ts`): up to 50 customers, sent 3 at a time
- **Internationalisation** (`lib/i18n`)
  - English and Hindi dictionaries, with the Hindi type forced to define every English key
  - Singular forms (`.one` keys) are used automatically
  - Customer messages go out in the customer's own language
- **Security**
  - All database access happens on the server with the secret key. Row level security is on with no policies, so the publishable key can read nothing
  - Every query is scoped to the demo's sandbox
  - Cron routes need a bearer secret
- **Feature flags** (`lib/features.ts`): `SHOP_QR_ENABLED` (off), `TRUST_RING_ENABLED` and `RECOVERY_FORECAST_ENABLED`

---

## Tech stack

| Layer | Choice |
| --- | --- |
| App | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Styling | Tailwind CSS v4 with Razorpay Blade design tokens |
| PWA | Serwist service worker, IndexedDB outbox |
| Database | Supabase Postgres (Mumbai), SQL functions and triggers, Realtime broadcast |
| Payments | Razorpay payment links, webhooks, Node SDK (test mode) |
| Push | Web Push (VAPID) with `web-push` |
| Hosting | Vercel (region `bom1`) and Vercel Cron |
| Tests | Vitest (unit and database), Puppeteer (browser tests at 360 px) |

## Project structure

```
app/
  page.tsx              Landing page
  app/                  Merchant app: home, customers, dues, udhaar
  s/[token]/            Customer statement page
  api/
    razorpay/webhook/   Signed Razorpay webhooks
    sync/               Offline outbox sync
    push/               Push subscribe and test
    cron/               Day-before reminders, nightly ledger check
  sw.ts                 Service worker (caching, push)
components/             UI (Trust Meter, Recovery Forecast, One tap reminders, offline sync, landing)
lib/
  data/                 Server-side queries (ledger, dues, trust, forecast)
  offline/              IndexedDB outbox
  razorpay/ payments/   Pay links, online payments
  i18n/                 English and Hindi dictionaries
  push.ts trust.ts      Push notifications, Trust Meter rules
supabase/migrations/    SQL schema, functions and triggers, applied in order
scripts/                Migrate, seed, Razorpay check, webhook sender
tests/                  Unit, database and browser tests
```

---

## Installation

### Prerequisites
- Node.js 20 or newer
- A [Supabase](https://supabase.com) project (Mumbai region recommended)
- A [Razorpay](https://razorpay.com) account in **test mode**
- Google Chrome, for the browser tests

### Steps

```bash
# 1. Install
git clone <this-repo-url> udhaar-suite
cd udhaar-suite
npm install

# 2. Configure
cp .env.example .env.local        # fill in the values (see below)
npx web-push generate-vapid-keys  # paste into the VAPID_* variables

# 3. Create the database
npm run db:migrate                # applies supabase/migrations in order (needs DATABASE_URL)

# 4. Check Razorpay keys (creates and cancels a ₹1 test link)
npm run razorpay:check

# 5. Run
npm run dev                       # http://localhost:3000
```

The demo shop is created and seeded the first time the app opens. **Reset demo** in the RK menu reloads it for everyone.

> The service worker runs only in production builds. To try offline mode, installing the app or push notifications locally, run `npm run build && npm start` instead of `npm run dev`.

### Environment variables

| Variable | Where it's used |
| --- | --- |
| `APP_URL` | Public URL used in links sent to customers |
| `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser key (can read nothing because of row level security) |
| `SUPABASE_SECRET_KEY` | Server-only database access |
| `DATABASE_URL` | Postgres connection string, only for `npm run db:migrate`. Keep it local, not on Vercel |
| `RAZORPAY_API_KEY`, `RAZORPAY_API_SECRET` | Razorpay test keys (server only) |
| `RAZORPAY_WEBHOOK_SECRET` | Any long random string, the same as in Razorpay Dashboard > Webhooks |
| `CRON_SECRET` | Bearer token for `/api/cron/*` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web Push keys and contact (`mailto:...`) |

`.env*` files are git-ignored, except `.env.example`. Never commit real keys.

---

## Deployment (Vercel)

1. Import the repo into Vercel and add the environment variables above, except `DATABASE_URL`
2. Deploy: `vercel deploy --prod`
3. In Razorpay Dashboard > Webhooks, add `https://<your-app>/api/razorpay/webhook` with `RAZORPAY_WEBHOOK_SECRET`
4. The cron jobs in `vercel.json` are picked up automatically

| Job | When | What |
| --- | --- | --- |
| `/api/cron/day-before` | 10:00 IST daily | SMS for udhaar due tomorrow (skips demo customers), plus the morning push digest |
| `/api/cron/ledger-check` | 02:00 IST daily | Ledger consistency report and Razorpay payments missing from the ledger |

Run a job by hand: `curl -H "Authorization: Bearer $CRON_SECRET" https://<your-app>/api/cron/ledger-check`

---

## Database

- Migrations live in `supabase/migrations/` and are applied in order by `npm run db:migrate`. Never edit an applied migration; add a new one.
- The shared demo lives in sandbox `00000000-0000-4000-8000-000000000001`. Reload it from the command line with `npm run db:seed -- --reset 00000000-0000-4000-8000-000000000001`.
- Seeded records never trigger automatic SMS.

## Razorpay testing

- `npm run razorpay:check` creates and cancels a ₹1 test payment link.
- `npm run webhook:send` posts a correctly signed sample webhook to `localhost:3000`. Options: `-- payment_link.partially_paid`, `-- qr_code.credited`, `-- --bad-signature`, `-- --url http://...`.
- Real webhooks are registered only for the deployed app.

## Tests

| Command | What it checks | Needs |
| --- | --- | --- |
| `npm test` | Unit tests, plus database tests when `TEST_DATABASE_ADMIN_URL` is set | Local Postgres for database tests |
| `npm run test:e2e` | Browser tests at 360 px against a production server on port 3100 (`BASE_URL` to point elsewhere) | Chrome |
| `npm run test:journey` | Full merchant journey, 3 runs in English and 3 in Hindi | A running app, `.env.local` |
| `npm run lint` | ESLint | |

Local stack for database and browser tests, which never touches the hosted project:

```bash
# 1. Local Postgres 15+ (for example Homebrew postgresql@15 on port 54329) and `brew install postgrest`
export TEST_DATABASE_ADMIN_URL=postgres://postgres@localhost:54329/postgres
npm test

# 2. Local stand-in for Supabase's API (PostgREST behind a key-checking gateway on :54321)
npm run db:local &

# 3. The app against it
npm run build
PORT=3100 SUPABASE_URL=http://localhost:54321 SUPABASE_SECRET_KEY=sb_secret_local_test_only npm start &
npm run test:e2e
```

---

Built for a Razorpay case competition. Razorpay is used in test mode; no real money moves.
