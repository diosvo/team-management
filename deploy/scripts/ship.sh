#!/usr/bin/env bash
# Upload a packaged release and run deploy/scripts/release.sh on the VPS.
#
# Env:
# • VPS_HOST
# • VPS_USER
# • VPS_SSH_KEY (private key contents)
# • VPS_KNOWN_HOSTS (pinned host key lines; see production.yaml)
#
# SSH files use a throwaway directory, never ~/.ssh.
set -euo pipefail

: "${VPS_HOST:?Missing VPS_HOST}"
: "${VPS_USER:?Missing VPS_USER}"
: "${VPS_SSH_KEY:?Missing VPS_SSH_KEY}"
: "${VPS_KNOWN_HOSTS:?Missing VPS_KNOWN_HOSTS}"
DIST_DIR="${1:-dist}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ssh_dir="$(mktemp -d)"
trap 'rm -rf "$ssh_dir"' EXIT

# Secrets pasted from Windows or stored on one line carry CRLF or literal "\n".
secret_lines() { printf '%b\n' "$1" | tr -d '\r' | sed '/^[[:space:]]*$/d'; }

secret_lines "$VPS_SSH_KEY" > "$ssh_dir/key"
chmod 600 "$ssh_dir/key"
if ! ssh-keygen -y -P '' -f "$ssh_dir/key" > /dev/null 2>&1; then
  echo "VPS_SSH_KEY is not a usable private key. Paste the whole private key" >&2
  echo "(BEGIN/END lines included, no passphrase), not the .pub file." >&2
  exit 1
fi
# Process VPS_KNOWN_HOSTS to ensure it contains a host key for VPS_HOST.
secret_lines "$VPS_KNOWN_HOSTS" |
  awk -v host="$VPS_HOST" '$1 ~ /^(ssh-|ecdsa-|sk-)/ { $0 = host " " $1 " " $2 } { print }' \
    > "$ssh_dir/known_hosts"
if ! ssh-keygen -F "$VPS_HOST" -f "$ssh_dir/known_hosts" > /dev/null; then
  echo "VPS_KNOWN_HOSTS has no host key for $VPS_HOST." >&2
  exit 1
fi

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

echo "Releasing in ~/team-portal"
ssh_vps "bash -s" < "$SCRIPT_DIR/release.sh"
