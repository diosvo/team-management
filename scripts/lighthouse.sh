#!/usr/bin/env bash
# Lighthouse CI on your machine: performance, accessibility, best practices
# and SEO for the public pages. Reports stay local (never uploaded).
#
# Usage:
# • pnpm lighthouse https://<domain>       (production; run from Vietnam, the geo filter blocks others)
# • pnpm lighthouse                        (http://localhost:3000; run `pnpm build && pnpm start` first)
#
# Arguments:
# • $1: base URL (default: http://localhost:3000)
#
# Environment variables:
# • PATHS: space-separated paths (default: "/login /docs")
# • PRESET: mobile or desktop (default: mobile)
# • RUNS: runs per page; the median is reported (default: 3)
#
# Needs Google Chrome. @lhci/cli is fetched once by pnpm dlx and cached, so it
# is not a project dependency.
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
BASE_URL="${BASE_URL%/}"

if [ $# -gt 1 ] || ! [[ "$BASE_URL" =~ ^https?://[^/]+$ ]]; then
  echo "Expected one base URL such as https://example.com, got: $*" >&2
  exit 1
fi
PATHS="${PATHS:-/login /docs}"
PRESET="${PRESET:-mobile}"
RUNS="${RUNS:-3}"
OUT_DIR=".lighthouseci/reports"

LHCI=(pnpm dlx @lhci/cli@0.16.1)

URL_ARGS=()
for path in $PATHS; do
  URL_ARGS+=("--url=$BASE_URL$path")
done

# macOS ships bash 3.2, where an empty array trips `set -u`; mobile is
# Lighthouse's default, so the flag is only added for desktop.
if [ "$PRESET" = desktop ]; then
  URL_ARGS+=(--settings.preset=desktop)
fi

rm -rf .lighthouseci
"${LHCI[@]}" collect "${URL_ARGS[@]}" --numberOfRuns="$RUNS"
"${LHCI[@]}" upload --target=filesystem --outputDir="$OUT_DIR"

echo
echo "Reports (open in a browser):"
ls "$OUT_DIR"/*.html
