#!/usr/bin/env bash
# Points DOMAIN at the VM's current external IP when it's an sslip.io name.
# An ephemeral IP changes when the VM is stopped (e.g. machine type change), so
# <old-ip>.sslip.io stops resolving here and Caddy can't serve https.
#
# Runs:
# • On every boot: @reboot crontab entry, installed by release.sh
# • On every release: release.sh with --no-restart, before compose up
# • By hand: bash ~/team-portal/deploy/scripts/sync-domain.sh
#
# Does nothing when DOMAIN is a real hostname or already matches the IP.
# A reserved static IP avoids the change altogether.
set -euo pipefail

cd "$(dirname "$0")/../.."
ENV_FILE=.env.production
METADATA_URL=http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip

current="$(sed -n 's/^DOMAIN=//p' "$ENV_FILE" | tr -d "\"'")"
if [[ "$current" != *.sslip.io ]]; then
  echo "DOMAIN=$current is not an sslip.io name; nothing to do"
  exit 0
fi

# The metadata server can take a moment to answer right after boot.
ip=""
for _ in $(seq 1 30); do
  ip="$(curl -fsS -H 'Metadata-Flavor: Google' "$METADATA_URL" 2>/dev/null)" && [[ -n "$ip" ]] && break
  sleep 2
done
if [[ -z "$ip" ]]; then
  echo "No external IP from the metadata server" >&2
  exit 1
fi

domain="${ip//./-}.sslip.io"
if [[ "$domain" == "$current" ]]; then
  echo "DOMAIN is already $domain"
  exit 0
fi

# --follow-symlinks keeps .env.production a link if it is one.
sed -i --follow-symlinks "s/^DOMAIN=.*/DOMAIN=$domain/" "$ENV_FILE"
echo "DOMAIN: $current → $domain"

[[ "${1:-}" == "--no-restart" ]] && exit 0

# Recreate app, caddy and cron with the new address; Caddy issues a new certificate.
until docker info >/dev/null 2>&1; do sleep 2; done
docker compose up -d --no-build
