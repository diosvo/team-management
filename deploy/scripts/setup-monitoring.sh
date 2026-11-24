#!/usr/bin/env bash
# One-time VPS setup for the traffic report. Safe to re-run: it only installs
# or restarts what is missing.
#
# Usage:
# • bash ~/team-portal/deploy/scripts/setup-monitoring.sh
# • ssh <user>@<host> 'bash -s' < deploy/scripts/setup-monitoring.sh
#
# Steps:
# • GoAccess: installed with apt when missing.
# • Caddy access log: the caddy container is recreated when the Caddyfile on
#   disk has the `log` block but the running container still has the old file.
set -euo pipefail

STACK_DIR="$HOME/team-portal"
CADDYFILE="$STACK_DIR/deploy/Caddyfile"

# --- GoAccess -------------------------------------------------------------
if command -v goaccess > /dev/null; then
  echo "✓ GoAccess $(goaccess --version | head -n 1 | awk '{print $NF}')"
else
  echo "… Installing GoAccess"
  sudo apt-get update -qq
  sudo apt-get install -y -qq goaccess
  echo "✓ GoAccess installed"
fi

# --- Caddy access log -----------------------------------------------------
has_log() { grep -q 'format json' "$1"; }

if ! has_log "$CADDYFILE"; then
  echo "✗ $CADDYFILE has no access log block." >&2
  echo "  Deploy a branch that has it, or copy it from your Mac:" >&2
  echo "  scp deploy/Caddyfile <user>@<host>:$CADDYFILE" >&2
  exit 1
fi

if docker exec caddy sh -c "grep -q 'format json' /etc/caddy/Caddyfile"; then
  echo "✓ Caddy access log is on"
else
  # The Caddyfile is a single-file mount: a replaced file only reaches the
  # container when it is recreated, not on restart.
  echo "… Recreating caddy to load the new Caddyfile (about 2s of downtime)"
  (cd "$STACK_DIR" && docker compose up -d --force-recreate --no-deps caddy)
  echo "✓ Caddy access log is on"
fi

echo
echo "Next: bash $STACK_DIR/deploy/scripts/traffic-report.sh 1h live"
