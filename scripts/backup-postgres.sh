#!/usr/bin/env bash
# Postgres backup → S3.
#
# Schedule via cron (or a Fly.io scheduled machine, etc.):
#   0 3 * * * /opt/celebratebanner/scripts/backup-postgres.sh
#
# Env required:
#   DATABASE_URL                  what we dump
#   BACKUP_S3_BUCKET              destination bucket (separate from uploads bucket!)
#   BACKUP_RETENTION_DAYS         keep dumps for N days (default 30)
#   AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY (or instance role)
#
# Exit codes: 0 success, 1 dump failed, 2 upload failed, 3 missing env.

set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL required}"
: "${BACKUP_S3_BUCKET:?BACKUP_S3_BUCKET required}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

STAMP=$(date -u +%Y%m%dT%H%M%SZ)
KEY="postgres/$(date -u +%Y/%m)/celebratebanner-${STAMP}.dump"
TMP=$(mktemp -t cbdump.XXXXXX.dump)
trap 'rm -f "$TMP"' EXIT

echo "[backup] dumping → $TMP"
if ! pg_dump --no-owner --no-acl --format=custom "$DATABASE_URL" -f "$TMP"; then
  echo "[backup] pg_dump failed" >&2
  exit 1
fi

SIZE_HUMAN=$(du -h "$TMP" | cut -f1)
echo "[backup] dump complete: $SIZE_HUMAN"

echo "[backup] uploading → s3://$BACKUP_S3_BUCKET/$KEY"
if ! aws s3 cp "$TMP" "s3://$BACKUP_S3_BUCKET/$KEY" \
    --storage-class STANDARD_IA \
    --metadata "stamp=$STAMP,source=production"; then
  echo "[backup] upload failed" >&2
  exit 2
fi

# Sweep old dumps (best-effort; lifecycle rules handle this too).
echo "[backup] pruning dumps older than $RETENTION_DAYS days"
CUTOFF=$(date -u -d "$RETENTION_DAYS days ago" +%Y%m%dT%H%M%SZ 2>/dev/null \
  || gdate -u -d "$RETENTION_DAYS days ago" +%Y%m%dT%H%M%SZ)
aws s3 ls "s3://$BACKUP_S3_BUCKET/postgres/" --recursive \
  | awk -v cutoff="$CUTOFF" '{
      n = split($NF, parts, "/");
      fname = parts[n];
      if (match(fname, /celebratebanner-([0-9TZ]+)\.dump/, m)) {
        if (m[1] < cutoff) print $NF;
      }
    }' \
  | while read -r OLDKEY; do
      echo "[backup] expiring s3://$BACKUP_S3_BUCKET/$OLDKEY"
      aws s3 rm "s3://$BACKUP_S3_BUCKET/$OLDKEY" >/dev/null
    done

echo "[backup] done"
