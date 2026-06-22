# Add Docker Support — Design Spec

> **Date:** 2026-06-21 · **Phase:** Brainstorm (approved) → Explore (completed)
> **Author:** Architect Agent · **Status:** Approved by project owner

---

## Goal

Make local setup faster for two audiences:

- **Contributors** — a dev container with hot reload, so no one needs to install an exact Node/pnpm version correctly.
- **Non-dev evaluators** (Bu Astin, dosen pembimbing) — a "build once, run it" container for demos/review.

Production deployment stays on Vercel, unchanged. Docker is for local use only.

---

## Explore Findings (verified from repo)

| Item | Finding |
|---|---|
| **Node version** | v25.8.2 on host. No `engines` or `packageManager` field in `package.json`. No `.nvmrc` file. |
| **pnpm version** | 10.33.0 on host. No `packageManager` field. |
| **`output: 'standalone'`** | **Missing** from `next.config.ts` — must be added for production image. |
| **`generateStaticParams`** | **Not used** anywhere — no routes hit DB at build time. |
| **Build-time env vars** | ~~Original finding: builder stage does NOT need `DATABASE_URL`.~~ **Corrected:** `next-auth`'s route handler (`/api/auth/[...nextauth]`) eagerly imports the DB driver module during Next.js page data collection. This throws `DATABASE_URL is missing` even though no queries execute. The trigger is module-level validation in the driver, not `generateStaticParams`. **Fix:** dummy `DATABASE_URL` and `AUTH_SECRET` as `ARG`+`ENV` in the builder stage. **Verified safe:** `grep -r 'localhost:5432' .next/` and `grep -r 'build-time-placeholder' .next/` inside the built runner image return zero hits — the dummy values are consumed only at import time and are not inlined into any shipped bundle. |
| **Sentry + no `SENTRY_AUTH_TOKEN`** | Build **does NOT hard-fail**. `@sentry/nextjs` v10.50 silently skips source map upload when the token is unset. The `.env.example` comment ("build fails without it") refers to Vercel deploys where you *want* source maps, not to the build itself. |
| **`DesignReference/` imports** | Only referenced in code **comments**, never imported. Safe to exclude in `.dockerignore`. |
| **`README.md`** | Exists (186 lines). Will add a "Running with Docker" section. |
| **`NEXT_PUBLIC_*` vars** | Only `NEXT_PUBLIC_SENTRY_DSN` — confirmed as the sole build-time arg. |

---

## Decisions Already Made — Do Not Re-litigate

- The app container connects to the **real cloud Neon + Upstash** via `.env.local`. No local Postgres/Redis containers, no Neon Local proxy.
  - Reason: the Neon client here is the HTTP driver (`@neondatabase/serverless`), and Redis access is Upstash's REST API — neither speaks to a vanilla `postgres`/`redis` container.
- Database migrations are **not** run automatically on container start. Stays a manual step (`pnpm drizzle-kit migrate`), consistent with the existing rule against destructive auto-sync.
- One `Dockerfile` with multiple build stages/targets, not separate Dockerfiles for dev and prod.

---

## Files to Add

### `Dockerfile`

Multi-stage build targeting `node:24-alpine` (Active LTS — Alpine for slim images):

| Stage | Purpose |
|---|---|
| `deps` | `pnpm install --frozen-lockfile` with corepack. Produces `node_modules`. |
| `dev` | Target for hot-reload. `CMD ["pnpm", "dev"]`. Bind-mounted source via compose. |
| `builder` | Runs `pnpm build`. Receives `ARG NEXT_PUBLIC_SENTRY_DSN` for build-time inlining. No other secrets. |
| `runner` | Copies Next.js standalone output. Runs as non-root `nextjs` user. `CMD ["node", "server.js"]`. `EXPOSE 3000`. |

> **Node version choice:** The host runs Node 25.8.2 but `node:25-alpine` is not a stable Docker Hub tag. Using `node:24-alpine` (Active LTS, supported until April 2028) — more future-proof than Node 22 (Maintenance LTS, April 2027). Next.js 16.2.4 supports Node ≥18.18.0. The `package.json` has no `engines` constraint.

### `.dockerignore`

Exclude: `node_modules`, `.next`, `.git`, `.env*`, `docs/superpowers`, `DesignReference/`, `coverage`, `.vscode`, `.claude`, `.husky`, `*.log`, `*.tsbuildinfo`.

### `docker-compose.yml` (dev)

```yaml
services:
  app:
    build:
      context: .
      target: dev
    volumes:
      - .:/app
      - /app/node_modules   # anonymous volume, preserves container's node_modules
    env_file: .env.local
    ports:
      - "3000:3000"
```

### `docker-compose.prod.yml` (production-style)

```yaml
services:
  app:
    build:
      context: .
      target: runner
      args:
        NEXT_PUBLIC_SENTRY_DSN: ${NEXT_PUBLIC_SENTRY_DSN:-}
    env_file: .env.local
    ports:
      - "3000:3000"
```

---

## Env Var Handling

- **Build arg (1):** `NEXT_PUBLIC_SENTRY_DSN` — inlined by Next.js at build time. Declared as `ARG` in the `builder` stage and passed via `build.args` in `docker-compose.prod.yml`.
- **Build-time dummies (2):** `DATABASE_URL` and `AUTH_SECRET` are declared as `ARG` with dummy defaults in the `builder` stage. They exist solely to satisfy module-level validation during `next build`'s page data collection phase (next-auth eagerly imports the DB driver). No actual DB connections or auth operations occur. The dummy values do NOT persist in the runner image (verified by grep), and using `ARG` scopes them to the build stage.
- **Runtime secrets (all others):** `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_JWT_SECRET`, `UPSTASH_REDIS_REST_URL/TOKEN`, `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `RESEND_API_KEY`, `ENCRYPTION_KEY`, `GOOGLE_CLIENT_ID/SECRET` — injected via `env_file:` only. Never as build args. The real `DATABASE_URL` and `AUTH_SECRET` at runtime come from this file, overriding the build-time dummies.
- **Compose gotcha:** Docker Compose reads `${VAR}` substitutions from a file literally named `.env` by default — not `.env.local`. Since this project uses `.env.local`, all compose commands must include `--env-file .env.local`. Documented in the README section.

---

## Code Change: `next.config.ts`

Add `output: 'standalone'` to the `nextConfig` object. This tells Next.js to emit a self-contained `server.js` + dependencies into `.next/standalone/`, which the `runner` stage copies.

This change is safe for Vercel — Vercel ignores `output: 'standalone'` and uses its own build pipeline.

---

## Out of Scope — Do Not Touch

- `.github/workflows/ci.yml` — no changes.
- Vercel deployment config — unaffected.
- No local Postgres/Redis containers or Neon Local proxy.
- No changes to LaTeX/academic report documents.
- No automatic migration execution in any container entrypoint.

---

## Project-Wide Change: pnpm Overrides Migration

> **This is not Docker plumbing.** Docker forced us to discover that the repo's override config was already incompatible with current pnpm.

During Docker build, `pnpm install --frozen-lockfile` failed with `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH` because pnpm 10.33.0 deprecated reading `overrides` from the `pnpm` field in `package.json`. On the host, this was masked because existing `node_modules` caused pnpm to skip resolution ("Lockfile is up to date, resolution step is skipped"). A fresh clone would hit the same error — Docker just found it first.

**Migration performed:**
- Moved `pnpm.overrides` (`uuid`, `postcss`, `eslint`) from `package.json` to `pnpm-workspace.yaml`
- Removed the deprecated `pnpm` key from `package.json`
- **Verified:** `pnpm install --frozen-lockfile` succeeds on a clean `node_modules` on the host, both before and after the migration (the pre-existing `ignoredBuiltDependencies` behavior is unchanged)

This changes every contributor's dependency resolution path. The overrides are identical — only their location moved — so resolution results are unchanged. But it is a conscious, called-out decision, not a Docker side-effect.

---

## Verification — Success Criteria

1. `docker compose --env-file .env.local up --build` → app reachable at `localhost:3000`, connected to real Neon/Upstash; editing a file under `src/` triggers fast refresh.
2. `docker compose -f docker-compose.prod.yml --env-file .env.local up --build` → optimized build serves at `localhost:3000`.
3. `docker build --target runner -t chp-app:prod .` succeeds with `SENTRY_AUTH_TOKEN` unset.
4. `docker history --no-trunc chp-app:prod` shows no runtime secret values baked into any layer.
5. Host-side `pnpm test`, `pnpm lint`, `npx tsc --noEmit`, `pnpm build` still pass — confirms `output: 'standalone'` didn't break anything.
6. Resulting image size is reasonable for an Alpine-based Next.js standalone build.
