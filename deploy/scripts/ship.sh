#!/usr/bin/env bash
# Upload a packaged release and run deploy/scripts/release.sh on the VPS.
#
# Env:
# • VPS_HOST
# • VPS_USER
# • VPS_SSH_KEY (private key contents)
# • VPS_PATH (remote stack directory; default: team-portal)
#
# SSH files use a throwaway directory, never ~/.ssh.
set -euo pipefail

: "${VPS_HOST:?Missing VPS_HOST}"
: "${VPS_USER:?Missing VPS_USER}"
: "${VPS_SSH_KEY:?Missing VPS_SSH_KEY}"
VPS_PATH="${VPS_PATH:-team-portal}"
DIST_DIR="${1:-dist}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ssh_dir="$(mktemp -d)"
trap 'rm -rf "$ssh_dir"' EXIT

printf '%s\n' "$VPS_SSH_KEY" > "$ssh_dir/key"
chmod 600 "$ssh_dir/key"
ssh-keyscan -T 15 "$VPS_HOST" > "$ssh_dir/known_hosts" 2>/dev/null

cat > "$ssh_dir/config" <<EOF
Host vps
  HostName $VPS_HOST
  User $VPS_USER
  IdentityFile $ssh_dir/key
  IdentitiesOnly yes
  UserKnownHostsFile $ssh_dir/known_hosts
  StrictHostKeyChecking yes
  ServerAliveInterval 30
EOF

ssh_vps() { ssh -F "$ssh_dir/config" vps "$@"; }

echo "Uploading release to $VPS_USER@$VPS_HOST:~/.deploy"
ssh_vps 'mkdir -p ~/.deploy'
scp -q -F "$ssh_dir/config" "$DIST_DIR/images.tar.gz" "$DIST_DIR/bundle.tar.gz" vps:~/.deploy/

echo "Releasing in ~/$VPS_PATH"
ssh_vps "VPS_PATH='$VPS_PATH' bash -s" < "$SCRIPT_DIR/release.sh"
