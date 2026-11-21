#!/bin/sh
# Nightly compressed pg_dump into ./backups, keeping BACKUP_KEEP_DAYS days.
set -eu
. /run/cron.env

file="/backups/db-$(date -u +%Y%m%d-%H%M).sql.gz"
pg_dump --no-owner --dbname "$DATABASE_URL" | gzip > "$file.tmp"
mv "$file.tmp" "$file"
find /backups -name 'db-*.sql.gz' -mtime "+${BACKUP_KEEP_DAYS}" -delete
echo "Backup written: $file"
