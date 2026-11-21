#!/usr/bin/env bash
# Run on the VPS to free disk space without touching data.
#
# Usage:
# • ssh <user>@<host> 'bash -s' < deploy/scripts/cleanup.sh
# • After a release: bash ~/team-portal/deploy/scripts/cleanup.sh
#
# Preserves:
# • Docker volumes: pgdata, uploads, caddy_data/caddy_config
# • ./backups and aaPanel files
# • Installed apt packages (needed by aaPanel)
#
# Environment variables:
# • JOURNAL_MAX: journald size to keep (default: 200M)
# • LOG_MAX_MB: container-log threshold (default: 50 MB)
# • RELEASE_DIR: release tarballs (default: ~/.deploy)
set -euo pipefail

JOURNAL_MAX="${JOURNAL_MAX:-200M}"
LOG_MAX_MB="${LOG_MAX_MB:-50}"
RELEASE_DIR="${RELEASE_DIR:-$HOME/.deploy}"
STACK_DIR="$HOME/team-portal"

step() { printf '\n== %s\n' "$1"; }

step "Disk before"
df -h /

step "Docker: images the stack doesn't use, build cache"
docker system df
# Not `docker image prune -a` / `container prune`: migrate and db-roles are
# stopped containers between releases, and `up --no-build` needs every image
# compose.yaml names (app, caddy-geo, postgres) even when unused.
keep="$(docker compose --project-directory "$STACK_DIR" config --images 2>/dev/null |
  sed 's/^docker\.io\/library\///' | sed '/:/!s/$/:latest/' | sort -u)"
if [[ -z "$keep" ]]; then
  echo "Can't read $STACK_DIR/compose.yaml; only removing dangling images."
else
  docker images --format '{{.Repository}}:{{.Tag}}' | grep -v '<none>' | sort -u |
    grep -vxF "$keep" | xargs -r docker rmi || true
fi
docker image prune -f # untagged leftovers of earlier releases
docker builder prune -a -f

step "Leftover release tarballs in $RELEASE_DIR"
rm -fv "$RELEASE_DIR"/*.tar.gz 2>/dev/null || true

step "Container logs over ${LOG_MAX_MB} MB"
sudo find /var/lib/docker/containers -name '*-json.log' -size "+${LOG_MAX_MB}M" \
  -print -exec truncate -s 0 {} \;

step "apt download cache"
sudo apt-get clean

step "systemd journal (keep $JOURNAL_MAX)"
sudo journalctl --vacuum-size="$JOURNAL_MAX"

step "Disk after"
df -h /
docker system df
