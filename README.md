# Udhaar Suite

Give credit safely, get paid on time. A mobile web app for small merchants inside the Razorpay ecosystem.
Product docs: `udhaar-suite-mvp-definition.md`, `udhaar-suite-build-roadmap.md`. Work tracking: `BOARD.md`.

Stack: Next.js 16 (App Router) · TypeScript · Tailwind with Razorpay Blade tokens · Serwist PWA ·
Supabase Postgres (Mumbai) · razorpay Node SDK · Vercel.

## Setup

```bash
npm install
cp .env.example .env.local     # then fill in the values
npm run db:migrate             # needs DATABASE_URL in .env.local
npm run dev                    # http://localhost:3000
```

There is no login. Everyone shares one demo of the merchant Ramesh Kirana, so changes are visible to all
visitors. **Reset demo** in the header menu reloads the seed data for everyone.

## Database

- Migrations live in `supabase/migrations/` and are applied in order by `npm run db:migrate`.
  Never edit an applied migration. Add a new one.
- All access is server side with the secret key. Row level security is on with no policies, so the
  publishable key can read nothing. Every query is scoped to the demo's sandbox.
- Money is integer paise. An entry's remaining balance and status are kept in step with its
  allocations by a database trigger.
- The shared demo lives in sandbox `00000000-0000-4000-8000-000000000001`. It is created and seeded on first use.
- `npm run db:seed -- --reset 00000000-0000-4000-8000-000000000001` reloads it from the command line.

## Razorpay

- `npm run razorpay:check` creates and cancels a Rs 1 test payment link with your test keys.
- Real webhooks are registered only for the Vercel deployment: `https://<app>/api/razorpay/webhook`.
- Locally, `npm run webhook:send` posts a correctly signed sample webhook to `localhost:3000`
  (`-- payment_link.partially_paid`, `-- qr_code.credited`, `-- --bad-signature`, `-- --url http://...`).
- Payment status is also synced when a screen opens (UD-18), so local testing needs no tunnel.

## Tests

| Command | What it checks | Needs |
| --- | --- | --- |
| `npm test` | Unit tests. DB tests too when `TEST_DATABASE_ADMIN_URL` is set | Local Postgres for DB tests |
| `npm run test:e2e` | Browser tests at 360 px against a running production server on port 3100 | Chrome, local stack below |
| `npm run lint` | ESLint | |

Local stack for DB and e2e tests (never touches the hosted project):

```bash
# 1. A local Postgres 15+, e.g. Homebrew postgresql@15 on port 54329, plus `brew install postgrest`
export TEST_DATABASE_ADMIN_URL=postgres://postgres@localhost:54329/postgres
npm test                                   # unit + DB tests

# 2. Local stand-in for Supabase's API (PostgREST behind a key-checking gateway on :54321)
npm run db:local &

# 3. The app against it
npm run build
PORT=3100 SUPABASE_URL=http://localhost:54321 SUPABASE_SECRET_KEY=sb_secret_local_test_only npm start &
npm run test:e2e
```
