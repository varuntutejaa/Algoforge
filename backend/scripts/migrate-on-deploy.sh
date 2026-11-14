#!/bin/sh
# Applies pending Prisma migrations during the API's Vercel build
# (buildCommand in vercel.json). A failure here fails the build, so an API that
# needs a new column can't go live without it.
set -eu

# Preview builds have no database configured.
if [ "${VERCEL_ENV:-}" != "production" ]; then
  echo "Skipping migrations outside production (VERCEL_ENV=${VERCEL_ENV:-unset})"
  exit 0
fi

# Production's DATABASE_URL is Supabase's transaction pooler (port 6543), which
# suits the serverless API but can't run migrations: prisma migrate deploy
# hangs on it. The session pooler is the same host on port 5432.
MIGRATE_URL=$(printf '%s' "$DATABASE_URL" | sed 's#:6543/#:5432/#')

# Never let a stuck connection hold the build until Vercel's 45-minute limit.
if command -v timeout >/dev/null 2>&1; then
  DATABASE_URL="$MIGRATE_URL" timeout 180 npx prisma migrate deploy
else
  DATABASE_URL="$MIGRATE_URL" npx prisma migrate deploy
fi
