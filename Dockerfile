# syntax=docker/dockerfile:1
# Production image for the VPS (Docker Compose): the Next.js standalone
# server, plus migrate.cjs, which the compose `migrate` service runs from the
# same image before the app starts.

ARG NODE_VERSION=26

FROM node:${NODE_VERSION}-trixie-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
# Node 25+ no longer bundles corepack, so install pnpm directly.
# git: fumadocs-mdx reads `git log` for each docs page's last-updated date.
# Both sit in this layer, so lockfile changes don't reinstall them.
RUN npm install --global pnpm@12.16.1 \
    && apt-get update \
    && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- Dependencies (cached until the lockfile changes) ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Local link: dependency (ts-plugin-intl-definition).
COPY tools ./tools
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ---- Build ----
FROM deps AS builder
COPY . .
# new Resend() throws without a key, and Better Auth logs errors without a
# secret or base URL, while Next collects page data. Build-only placeholders:
# the real values come from .env.production and compose.yaml at runtime.
RUN RESEND_API_KEY=re_build_placeholder \
    BETTER_AUTH_SECRET=build-placeholder-not-used-at-runtime \
    BETTER_AUTH_URL=http://localhost:3000 \
    pnpm build
# Migrations as one self-contained file, so the runtime image can apply them
# without the build's node_modules. pg-native is an optional pg add-on.
RUN pnpm exec esbuild src/drizzle/scripts/migrate.ts --bundle --platform=node \
    --format=cjs --external:pg-native --log-level=warning --outfile=migrate.cjs

# ---- Runtime ----
FROM node:${NODE_VERSION}-trixie-slim AS runner
# Chromium renders the analytics PDFs; DejaVu covers Vietnamese glyphs.
RUN apt-get update \
    && apt-get install -y --no-install-recommends chromium fonts-dejavu-core ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    CHROMIUM_PATH=/usr/bin/chromium \
    UPLOAD_DIR=/data/uploads

WORKDIR /app
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder /app/migrate.cjs ./
COPY --from=builder /app/src/drizzle/migrations ./src/drizzle/migrations

# Owned by node so a fresh named volume inherits writable permissions.
RUN mkdir -p /data/uploads && chown node:node /data/uploads

USER node
EXPOSE 3000
CMD ["node", "server.js"]
