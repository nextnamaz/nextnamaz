#!/usr/bin/env bash
#
# Dump the production database before a migration.
#
# On 2026-07-25 a rebuild migration dropped every table in this project and
# there was nothing to restore from. Run this first, every time, and check the
# file is non-empty before you migrate.
#
# Usage:  ./scripts/backup-db.sh
# Needs:  SUPABASE_DB_URL in the environment or in .env.local
#         (Supabase dashboard -> Project Settings -> Database -> Connection
#          string -> URI, session pooler)
#
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -z "${SUPABASE_DB_URL:-}" && -f .env.local ]]; then
  SUPABASE_DB_URL="$(grep -E '^SUPABASE_DB_URL=' .env.local | cut -d= -f2- || true)"
fi

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "SUPABASE_DB_URL is not set. Add it to .env.local or export it." >&2
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "pg_dump not found. Install postgresql-client." >&2
  exit 1
fi

mkdir -p backups
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="backups/nextnamaz-${STAMP}.sql"

echo "Dumping to ${OUT} ..."
pg_dump "$SUPABASE_DB_URL" \
  --no-owner --no-privileges \
  --schema=public --schema=storage \
  --file "$OUT"

if [[ ! -s "$OUT" ]]; then
  echo "Dump is empty. Do NOT migrate." >&2
  exit 1
fi

echo "OK  $(du -h "$OUT" | cut -f1)  ${OUT}"
echo "Rows captured:"
grep -cE '^INSERT|^COPY' "$OUT" || true
