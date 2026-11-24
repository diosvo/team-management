#!/usr/bin/env bash
# Build a GoAccess traffic report from Caddy's access log.
#
# Usage:
# • bash ~/team-portal/deploy/scripts/traffic-report.sh      # HTML, last 7d
# • bash .../traffic-report.sh 30d                           # d, h or m
# • bash .../traffic-report.sh 7d tui                        # terminal snapshot
# • bash .../traffic-report.sh 1h live                       # live terminal
#
# Attack signals:
# • Geo Location: countries except VN are geo-filtered traffic.
# • HTTP 403 / Requested Files: blocked /.env and /wp-login.php probes.
# • Visitor Hostnames / IPs: busiest addresses.
#
# Empty panels:
# • 404s: unknown signed-out paths redirect to /login.
# • Static requests: /_next/static files are cached for a year.
#
# Arguments:
# • $1: time window (default: 7d)
# • $2: tui or live (otherwise HTML)
#
# Environment:
# • REPORT: output file (default: ~/traffic-report.html)
#
# Download without serving publicly:
# • scp <user>@<host>:~/traffic-report.html .
set -euo pipefail

SINCE="${1:-7d}"
MODE="${2:-html}"

# `docker logs --since` takes h/m/s only, so days become hours (7d → 168h).
if [[ "$SINCE" =~ ^([0-9]+)d$ ]]; then
  DOCKER_SINCE="$((BASH_REMATCH[1] * 24))h"
else
  DOCKER_SINCE="$SINCE"
fi
REPORT="${REPORT:-$HOME/traffic-report.html}"

if ! command -v goaccess > /dev/null; then
  echo "GoAccess is missing: bash $(dirname "$0")/setup-monitoring.sh" >&2
  exit 1
fi

case "$MODE" in
  html | tui | live) ;;
  *)
    echo "Unknown mode: $MODE (use html, tui or live)" >&2
    exit 1
    ;;
esac

# Fails here with Docker's message on a bad window or a stopped container,
# instead of an empty report.
docker logs caddy --since "$DOCKER_SINCE" --tail 0 > /dev/null

# Countries: reuse the DB-IP country database baked into the caddy image.
GEOIP="$(mktemp --suffix=.mmdb)"
trap 'rm -f "$GEOIP"' EXIT
GEOIP_ARGS=()
if docker cp caddy:/etc/caddy/country.mmdb "$GEOIP" 2> /dev/null; then
  GEOIP_ARGS=(--geoip-database="$GEOIP")
fi

OUTPUT_ARGS=(--html-report-title="Team portal traffic (last $SINCE)" -o "$REPORT")
FOLLOW_ARGS=()
case "$MODE" in
  tui) OUTPUT_ARGS=() ;;
  live) OUTPUT_ARGS=() FOLLOW_ARGS=(--follow) ;;
esac

# Access-log lines only; Caddy's own startup and TLS messages are skipped.
# `|| true`: no requests in the window still writes an (empty) report.
docker logs caddy --since "$DOCKER_SINCE" ${FOLLOW_ARGS[@]+"${FOLLOW_ARGS[@]}"} 2>&1 \
  | { grep --line-buffered '"http.log.access' || true; } \
  | goaccess - --log-format=CADDY ${GEOIP_ARGS[@]+"${GEOIP_ARGS[@]}"} --no-query-string ${OUTPUT_ARGS[@]+"${OUTPUT_ARGS[@]}"}

if [ "$MODE" = html ]; then
  echo "Report: $REPORT"
fi
