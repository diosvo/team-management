#!/usr/bin/env bash
# Runs on the VPS to unpack and deploy a release.
# • CI: deploy/scripts/ship.sh
# • Manual rollback: download <run-id> with vps-release artifacts
# • Copy images*.tar.gz and bundle.tar.gz to ~/.deploy
# • Run: bash ~/team-portal/deploy/scripts/release.sh
#
# Environment:
# • RELEASE_DIR: tarball directory (default: ~/.deploy)
set -euo pipefail

STACK_DIR="$HOME/team-portal"
RELEASE_DIR="${RELEASE_DIR:-$HOME/.deploy}"

cd "$STACK_DIR"
if [[ ! -f .env.production ]]; then
  echo "::error::$STACK_DIR/.env.production is missing"
  exit 1
fi
ln -sf .env.production .env

tar -xzf "$RELEASE_DIR/bundle.tar.gz"
shopt -s nullglob
archives=("$RELEASE_DIR"/images*.tar.gz)
if [[ ${#archives[@]} -eq 0 ]]; then
  echo "::error::No images*.tar.gz in $RELEASE_DIR"
  exit 1
fi
for archive in "${archives[@]}"; do
  gunzip -c "$archive" | docker load
done
rm -f "${archives[@]}" "$RELEASE_DIR/bundle.tar.gz"

# Keep an sslip.io DOMAIN on the current IP, now and after every reboot.
bash deploy/scripts/sync-domain.sh --no-restart
if command -v crontab >/dev/null; then
  boot_job="@reboot bash $STACK_DIR/deploy/scripts/sync-domain.sh >> $STACK_DIR/sync-domain.log 2>&1"
  { crontab -l 2>/dev/null | grep -vF 'sync-domain.sh' || true; echo "$boot_job"; } | crontab -
else
  echo "::warning::crontab not found; DOMAIN won't follow IP changes after a reboot"
fi

show_failure() {
  echo "::error::$1"
  docker compose ps -a
  docker compose logs --tail 80 migrate db-roles app
  exit 1
}

# Recreates what changed; --remove-orphans drops services no longer in compose.
# Under set -e a failed `up` (e.g. migrate exiting 1) would skip the logs.
docker compose up -d --no-build --remove-orphans ||
  show_failure "docker compose up failed"

# Smoke test: the app answers inside its container.
for _ in $(seq 1 30); do
  if docker compose exec -T app node -e \
    "fetch('http://127.0.0.1:3000/login').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"; then
    echo "App is up"
    docker compose ps
    docker image prune -f
    exit 0
  fi
  sleep 2
done

show_failure "App did not become healthy"
