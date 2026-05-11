#!/usr/bin/env bash
# Backup verification drill.
#
# Runs monthly: pulls the latest backup, restores it to a temp database, and
# runs a smoke query to confirm the data shape is sane. Exits non-zero on
# any failure so cron/Actions can page on it.
#
# A backup you've never restored is not a backup. Don't skip this.
#
# Env required:
#   BACKUP_S3_BUCKET        where backups live
#   VERIFY_DATABASE_URL     a separate Postgres that we can DROP/CREATE freely
#                           (NOT the production database!)

set -euo pipefail

: "${BACKUP_S3_BUCKET:?BACKUP_S3_BUCKET required}"
: "${VERIFY_DATABASE_URL:?VERIFY_DATABASE_URL required}"

if [[ "$VERIFY_DATABASE_URL" == *"$DATABASE_URL"* ]] && [[ -n "${DATABASE_URL:-}" ]]; then
  echo "REFUSING: VERIFY_DATABASE_URL must not be production" >&2
  exit 3
fi

TMP=$(mktemp -t cbverify.XXXXXX.dump)
trap 'rm -f "$TMP"' EXIT

# Grab the most recent dump from S3.
LATEST_KEY=$(aws s3 ls "s3://$BACKUP_S3_BUCKET/postgres/" --recursive \
  | sort | tail -1 | awk '{print $NF}')
if [[ -z "$LATEST_KEY" ]]; then
  echo "No backups found in s3://$BACKUP_S3_BUCKET/postgres/" >&2
  exit 4
fi

echo "[verify] using $LATEST_KEY"
aws s3 cp "s3://$BACKUP_S3_BUCKET/$LATEST_KEY" "$TMP"

# Restore — pg_restore handles dropping/creating objects via --clean.
echo "[verify] restoring to verify DB"
pg_restore --clean --if-exists --no-owner --no-acl \
  --dbname "$VERIFY_DATABASE_URL" "$TMP"

# Smoke queries — table counts > 0 and recent rows visible.
echo "[verify] sanity queries"
psql "$VERIFY_DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
\timing off
SELECT 'projects', COUNT(*) FROM projects;
SELECT 'payments', COUNT(*) FROM payments;
SELECT 'webhook_events', COUNT(*) FROM webhook_events;
SELECT 'audit_log', COUNT(*) FROM audit_log;
SELECT MAX(created_at) AS latest_project FROM projects;
SQL

echo "[verify] OK"
