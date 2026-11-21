# syntax=docker/dockerfile:1
# Production image for the VPS (Docker Compose). Targets:
#   runner   — the Next.js standalone server (default)
#   migrator — runs Drizzle migrations once before the app starts

ARG NODE_VERSION=26

FROM node:${NODE_VERSION}-trixie-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
# Node 25+ no longer bundles corepack, so install pnpm directly.
RUN npm install --global pnpm@12.16.1
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
# fumadocs-mdx reads `git log` for each docs page's last-updated date.
RUN apt-get update \
    && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*
COPY . .
# new Resend() throws without a key while Next collects page data. Build-only
# placeholder: the real key comes from .env at runtime.
RUN RESEND_API_KEY=re_build_placeholder pnpm build

# ---- Migrations ----
FROM deps AS migrator
COPY tsconfig.json env.config.ts global.d.ts ./
COPY src ./src
CMD ["pnpm", "db:migrate"]

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

# Owned by node so a fresh named volume inherits writable permissions.
RUN mkdir -p /data/uploads && chown node:node /data/uploads

USER node
EXPOSE 3000
CMD ["node", "server.js"]
