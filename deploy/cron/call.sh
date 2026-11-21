#!/bin/sh
# Call a cron route through the public domain, so report links and the
# Puppeteer session use the real origin (requestOrigin reads the Host header).
set -eu
. /run/cron.env

wget -q -O - -T 120 \
  --header "Authorization: Bearer ${CRON_SECRET}" \
  "${PUBLIC_SCHEME:-https}://${DOMAIN}$1"
echo
