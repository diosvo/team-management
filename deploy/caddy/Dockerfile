# syntax=docker/dockerfile:1
# Caddy image with country filtering (deploy/Caddyfile).
# • Built alongside the app by GitHub Actions.
# • Rebuilt monthly to update the country database.
#
# GeoIP data:
# • DB-IP Lite (https://db-ip.com), CC BY 4.0.
# • No account or key required.
# • Uses the MaxMind format required by the plugin.

FROM caddy:2-builder-alpine AS builder
RUN xcaddy build --with github.com/porech/caddy-maxmind-geolocation

FROM alpine:3 AS geoip
# Changes monthly (passed by the workflow) so the download is not served from
# the build cache forever. Falls back to last month's file early in a month.
ARG GEOIP_MONTH=unset
RUN set -eu; \
    echo "GeoIP build month: $GEOIP_MONTH"; \
    y=$(date -u +%Y); m=$(date -u +%m); m=${m#0}; \
    for attempt in 1 2; do \
      month=$(printf '%04d-%02d' "$y" "$m"); \
      if wget -qO /tmp/country.mmdb.gz "https://download.db-ip.com/free/dbip-country-lite-$month.mmdb.gz"; then \
        echo "Using DB-IP country lite $month"; break; \
      fi; \
      m=$((m - 1)); if [ "$m" -eq 0 ]; then m=12; y=$((y - 1)); fi; \
    done; \
    gunzip -c /tmp/country.mmdb.gz > /country.mmdb; \
    test -s /country.mmdb

FROM caddy:2-alpine
COPY --from=builder /usr/bin/caddy /usr/bin/caddy
COPY --from=geoip /country.mmdb /etc/caddy/country.mmdb
