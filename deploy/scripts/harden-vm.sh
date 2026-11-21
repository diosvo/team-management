#!/usr/bin/env bash
# Host hardening for the VPS, from the aaPanel security scan. Safe to re-run.
#
# Usage: ssh <user>@<host> 'sudo bash -s' < deploy/scripts/harden-vm.sh
#
# Fixes:
# • sshd: Protocol 2, LoginGraceTime 60, ClientAliveInterval 600
# • /etc/login.defs: PASS_MIN_DAYS 7 (+ root)
# • Shell idle timeout: TMOUT=600 in /etc/profile
# • setuid/setgid bits off chage, gpasswd, chfn, chsh, newgrp, mount, umount
# • grub.cfg: 600, owned by root
#
# Left out on purpose (they would lock out deploys or Google's SSH):
# • TCP Wrappers / hosts.allow whitelist: Debian's sshd ignores them, and
#   GitHub runners connect from changing IPs. Use a GCP firewall rule instead.
# • NOPASSWD in /etc/sudoers.d/google_sudoers: written by the Google guest
#   agent (it puts it back), and key-only users have no password to type.
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Run as root: sudo bash $0" >&2
  exit 1
fi

# --- sshd ---------------------------------------------------------------
SSHD=/etc/ssh/sshd_config
cp -n "$SSHD" "$SSHD.bak"

# Drops every existing (or commented) line for the key, then puts it first:
# sshd keeps the first value it reads, ahead of Include'd drop-ins.
set_sshd() {
  sed -i -E "/^[[:space:]]*#?[[:space:]]*$1([[:space:]]|$)/Id" "$SSHD"
  sed -i "1i $1 $2" "$SSHD"
}
set_sshd Protocol 2
set_sshd LoginGraceTime 60
set_sshd ClientAliveInterval 600
set_sshd ClientAliveCountMax 3

if sshd -t; then
  systemctl restart ssh
  echo "sshd: updated and restarted"
else
  cp "$SSHD.bak" "$SSHD"
  echo "sshd: config invalid, restored $SSHD.bak" >&2
  exit 1
fi

# --- Password ageing -----------------------------------------------------
if grep -qE '^[[:space:]]*PASS_MIN_DAYS' /etc/login.defs; then
  sed -i -E 's/^[[:space:]]*PASS_MIN_DAYS.*/PASS_MIN_DAYS\t7/' /etc/login.defs
else
  printf 'PASS_MIN_DAYS\t7\n' >> /etc/login.defs
fi
chage --mindays 7 root
echo "login.defs: PASS_MIN_DAYS 7"

# --- Shell idle timeout --------------------------------------------------
if ! grep -qE '^[[:space:]]*(export[[:space:]]+)?TMOUT=' /etc/profile; then
  printf '\n# Log out idle interactive shells after 10 minutes.\nTMOUT=600\nexport TMOUT\n' >> /etc/profile
fi
echo "profile: TMOUT=600"

# --- setuid/setgid -------------------------------------------------------
# Only root can then use these; package upgrades may restore the bits.
for bin in /usr/bin/chage /usr/bin/gpasswd /usr/bin/chfn /usr/bin/chsh \
  /usr/bin/newgrp /usr/bin/mount /usr/bin/umount; do
  [[ -e "$bin" ]] && chmod u-s,g-s "$bin"
done
echo "suid: removed"

# --- Bootloader ----------------------------------------------------------
for cfg in /boot/grub/grub.cfg /boot/grub2/grub.cfg; do
  if [[ -e "$cfg" ]]; then
    chown root "$cfg"
    chmod 600 "$cfg"
    echo "grub: $cfg 600"
  fi
done
