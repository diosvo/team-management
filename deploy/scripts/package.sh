#!/usr/bin/env bash
# Package release artifacts into dist/
# • Built app and caddy-geo images
# • Compose and deploy stack files
# • Run from repo root after building images
set -euo pipefail

OUT_DIR="${1:-dist}"
IMAGES=(app:latest caddy-geo:latest)

mkdir -p "$OUT_DIR"

docker save "${IMAGES[@]}" | gzip -1 > "$OUT_DIR/images.tar.gz"

# No macOS metadata when run on a Mac (GNU tar on CI ignores the variable).
COPYFILE_DISABLE=1 tar -czf "$OUT_DIR/bundle.tar.gz" \
  compose.yaml \
  deploy/Caddyfile \
  deploy/crontab \
  deploy/cron \
  deploy/db \
  deploy/caddy \
  deploy/scripts/release.sh \
  deploy/scripts/cleanup.sh \
  deploy/scripts/sync-domain.sh

ls -lh "$OUT_DIR"
