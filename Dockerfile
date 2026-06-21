# ==============================================================================
# CHP Digital Assessment Platform — Multi-stage Dockerfile
# ==============================================================================
# Stages: deps → dev → builder → runner
#
# Usage:
#   Dev (hot-reload):  docker compose --env-file .env.local up --build
#   Prod (optimized):  docker compose -f docker-compose.prod.yml --env-file .env.local up --build
#   Standalone build:  docker build --target runner -t chp-app:prod .
# ==============================================================================

# ── Stage 1: deps ─────────────────────────────────────────────────────────────
# Install production + dev dependencies with pnpm (frozen lockfile).
FROM node:24-alpine AS deps

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app

# Copy only the files pnpm needs to resolve dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile


# ── Stage 2: dev ──────────────────────────────────────────────────────────────
# Target for docker-compose.yml — bind-mounts the host source tree for hot reload.
# node_modules come from the deps stage; the anonymous volume in compose keeps them.
FROM deps AS dev

# Next.js telemetry is not useful in a local dev container
ENV NEXT_TELEMETRY_DISABLED=1

# Expose the dev server port
EXPOSE 3000

# --hostname 0.0.0.0 is required so the dev server listens on all interfaces
# (otherwise it binds to 127.0.0.1 and is unreachable from the Docker host).
CMD ["pnpm", "dev", "--hostname", "0.0.0.0"]


# ── Stage 3: builder ─────────────────────────────────────────────────────────
# Runs `pnpm build`. The only build-time arg is NEXT_PUBLIC_SENTRY_DSN because
# Next.js inlines NEXT_PUBLIC_* vars at compile time. All other secrets are
# runtime-only and must NEVER be passed as build args.
FROM deps AS builder

WORKDIR /app

# Copy the full source tree (filtered by .dockerignore)
COPY . .

# The sole build-time variable — Next.js inlines NEXT_PUBLIC_* at compile time.
# If unset, Sentry client-side reporting simply won't have a DSN (non-fatal).
ARG NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Dummy values for modules that validate env vars at import time.
# next-auth's route handler eagerly imports the DB driver, which throws
# if DATABASE_URL is missing. No actual DB calls happen at build time
# (no generateStaticParams), so these are never used for real connections.
# Using ARG+ENV so they exist during `pnpm build` but don't persist in the image.
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ARG AUTH_SECRET="build-time-placeholder-not-used-at-runtime"
ENV DATABASE_URL=${DATABASE_URL}
ENV AUTH_SECRET=${AUTH_SECRET}

RUN pnpm build


# ── Stage 4: runner ───────────────────────────────────────────────────────────
# Minimal production image using the Next.js standalone output.
# No source code, no devDependencies, no secrets baked in.
FROM node:24-alpine AS runner

WORKDIR /app

# Disable telemetry in production container
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the public assets
COPY --from=builder /app/public ./public

# Copy the standalone server output (includes a minimal node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy the static assets (.next/static is NOT included in standalone by default)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Run as non-root
USER nextjs

EXPOSE 3000

# The standalone output produces a self-contained server.js
CMD ["node", "server.js"]
