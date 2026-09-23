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

# pg_dump refuses a server newer than itself. The project runs Postgres 17;
# with an older local client, use the official image's client instead.
dump() { pg_dump "$@"; }
if ! pg_dump --version 2>/dev/null | grep -qE ' (1[7-9]|[2-9][0-9])\.'; then
  if command -v docker >/dev/null 2>&1; then
    dump() { docker run --rm --network host postgres:17-alpine pg_dump "$@"; }
  else
    echo "Need pg_dump 17 or newer (or docker). Install postgresql-client-17." >&2
    exit 1
  fi
fi

mkdir -p backups
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="backups/nextnamaz-${STAMP}.sql"

echo "Dumping to ${OUT} ..."
dump "$SUPABASE_DB_URL" \
  --no-owner --no-privileges \
  --schema=public --schema=storage \
  > "$OUT"

if [[ ! -s "$OUT" ]]; then
  echo "Dump is empty. Do NOT migrate." >&2
  exit 1
fi

echo "OK  $(du -h "$OUT" | cut -f1)  ${OUT}"
echo "Rows captured:"
grep -cE '^INSERT|^COPY' "$OUT" || true
