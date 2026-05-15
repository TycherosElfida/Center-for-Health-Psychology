# CHP Digital Assessment Platform

A web application for the **Center for Health Psychology (CHP)** at Universitas Kristen Krida Wacana (UKRIDA), Jakarta. Delivers validated psychometric instruments (PSS-10, GPIUS-2, SRS, SRQ-29), computes clinical scores, and produces interpretive reports.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.4 (App Router) with React Compiler |
| Language | TypeScript 6.0.3 (strict mode) |
| UI | React 19.2.5, Tailwind CSS 4.2.4 (`@theme inline`, oklch), shadcn/ui, Motion |
| API | tRPC v11.16.0 |
| Database | Neon PostgreSQL via Drizzle ORM 1.0.0-beta.20 (neon-http driver) |
| Auth (users) | Auth.js v5 (credentials + magic-link ready) |
| Auth (admin) | Custom JWT via `jose` — separate system, never mixed with user auth |
| Rate limiting | Upstash Redis |
| Email | Resend |
| Observability | Sentry (browser + server + edge) |
| PDF reports | `@react-pdf/renderer` |
| Tests | Vitest 4.1.5 (157 passing) |

## Prerequisites

- **Node.js 22+** (matches the CI runner)
- **pnpm 9+** — `npm install -g pnpm`
- Accounts on:
  - [Neon](https://neon.tech) — managed PostgreSQL
  - [Upstash](https://upstash.com) — Redis for rate limiting
  - [Resend](https://resend.com) — transactional email
  - [Sentry](https://sentry.io) — error monitoring (free tier is enough)

## Local Setup

```bash
# 1. Clone and install
git clone https://github.com/TycherosElfida/Center-for-Health-Psychology.git
cd Center-for-Health-Psychology
pnpm install

# 2. Configure environment
cp .env.example .env.local
# Open .env.local and fill in each value. See .env.example for guidance
# on where to obtain each one.

# 3. Push the schema to Neon
pnpm db:push

# 4. Seed the 4 canonical instruments + bootstrap a super_admin
#    (ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env.local for this step)
pnpm db:seed

# 5. Start the dev server
pnpm dev
# → open http://localhost:3000
```

The seed script is idempotent: re-running it skips existing rows. It will refuse to bootstrap the admin if `ADMIN_EMAIL` / `ADMIN_PASSWORD` are unset, but everything else still runs.

## Key Scripts

| Script | Purpose |
|---|---|
| `pnpm dev` | Start Next.js in development mode |
| `pnpm build` | Production build (requires `SENTRY_AUTH_TOKEN` for source-map upload) |
| `pnpm test` | Run the Vitest suite (157 tests across 21 files) |
| `pnpm lint` | Run ESLint with the repo config |
| `pnpm db:push` | Apply the Drizzle schema directly to the DB (no migration file) |
| `pnpm db:seed` | Seed the 4 instruments, interpretation ranges, and (optional) super_admin |
| `pnpm db:studio` | Open Drizzle Studio against the configured DB |
| `pnpm db:generate` | Generate a migration from the current schema (rarely used here) |
| `pnpm db:migrate` | Apply tracked migrations (rarely used — `db:push` is the day-to-day workflow) |

## Architecture Overview

The codebase is a Next.js 16 App Router app organized into a **public site** (`src/app/(public)`-style pages plus the catalog and assessment flow under `src/app/tests`, `/test/[slug]`, `/results/[scoreId]`) and a separate **admin panel** under `src/app/admin/`. The two areas use **deliberately separate authentication systems**: Auth.js v5 handles end-user sessions, while the admin panel uses a custom JWT issued and verified with `jose`. They share no cookies and no DB tables — this prevents privilege escalation if either system has a bug.

All server-side data access flows through **tRPC v11** procedures in `src/server/trpc/procedures/` (public-tests, sessions, results, profile, plus the `admin-*` family). Procedures talk to **Neon PostgreSQL** through **Drizzle ORM** (`neon-http` driver — note: no transaction support, all writes are sequential). The schema lives in `src/server/schema/` across 13 modules and 16 tables.

The **scoring engine** in `src/server/scoring/engine.ts` is a pure ~80-line function: no DB calls, no side effects. Given an answer map and question metadata it returns total/dimension/raw scores and `maxPossibleScore`. Interpretation lookup is a separate side-effecting function in `interpretation.ts` that queries `result_interpretations` for the matching band and snapshots the result into the `results.computed_scores` JSONB column at submit time.

The platform supports **anonymous (guest) and authenticated** flows. Anonymous sessions get a 72h single-use `claimToken` so guests can register after seeing their result and retroactively own the session. **PDF reports** are generated server-side via `@react-pdf/renderer` against the assembled report data, and email delivery is queued through Resend in the `report_requests` table.

## Admin Access

The seed script bootstraps a single **super_admin** account from environment variables:

1. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env.local` (see `.env.example`).
2. Run `pnpm db:seed`. The script hashes the password with bcrypt and inserts a row with `mustChangePassword: true`.
3. Log in at `/admin/login`. The first login will require you to set a new password.

After the bootstrap, the super_admin can create additional admin users from the Account Management page. Re-running `pnpm db:seed` with the same `ADMIN_EMAIL` is a no-op (idempotency check on the email column).

## Deployment

The recommended target is **Vercel**.

1. Push to `master` on GitHub (the only branch that exists post-handover).
2. Import the repo into Vercel — it auto-detects Next.js.
3. In **Project → Settings → Environment Variables**, add every variable listed in `.env.example`. The critical ones for the build step:
   - `DATABASE_URL` — points to the production Neon branch.
   - `SENTRY_AUTH_TOKEN` — **without this the build will fail** because the Sentry plugin uploads source maps at compile time.
   - `AUTH_SECRET`, `ADMIN_JWT_SECRET`, `ENCRYPTION_KEY` — generate fresh secrets for production; never reuse local dev values.
4. Deploy. If the production DB has not yet been initialized, run `pnpm db:push` and `pnpm db:seed` locally with the production `DATABASE_URL` exported, then redeploy.

**No `vercel.json` is required.** All routing (including the Sentry tunnel route `/monitoring`) and image optimization are handled by Next.js conventions Vercel auto-detects from `next.config.ts`.

## Known Limitations

The platform is live and functional for the 4 canonical instruments. Known gaps, deferred fixes, and parked specs are documented in [docs/HANDOFF_LIMITATIONS.md](docs/HANDOFF_LIMITATIONS.md). The most consequential ones are listed there as **L1–L14** with file pointers, effort estimates, and rationale for deferral.

## License & Academic Context

This codebase is an **undergraduate internship (Kerja Praktik) deliverable** prepared for the **Center for Health Psychology at UKRIDA Jakarta** during the 2026 academic term. Scope was frozen by the dean of psychology ahead of the handover. The code is not licensed for redistribution outside CHP/UKRIDA without separate permission.

- **Lead developer:** Sanders (NIM 412023020)
- **Co-developer (UI/UX):** Febriane Veranica
- **Handover date:** 2026-05-22
