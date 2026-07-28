#!/usr/bin/env bash
# Repoints "current" back to "previous" and reloads PM2. Used both by
# release.sh automatically on a failed health check, and standalone for a
# manually-triggered emergency rollback (see the rollback GitHub Actions job).
set -euo pipefail

BASE_DIR="/home/ec2-user/backend"
SHARED_DIR="$BASE_DIR/shared"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ ! -L "$BASE_DIR/previous" ]; then
    echo "[rollback] no 'previous' release exists — nothing to roll back to" >&2
    exit 2
fi

TARGET="$(readlink "$BASE_DIR/previous")"
if [ ! -d "$TARGET" ]; then
    echo "[rollback] 'previous' points at $TARGET, which no longer exists" >&2
    exit 2
fi

echo "[rollback] restoring current -> $TARGET"
ln -sfn "$TARGET" "$BASE_DIR/current"

PORT="$(grep -E '^PORT=' "$SHARED_DIR/.env" 2>/dev/null | cut -d= -f2 || true)"
PORT="${PORT:-8000}"

export APP_VERSION="$(basename "$TARGET")"
pm2 startOrReload "$SHARED_DIR/ecosystem.config.js" --update-env

if bash "$SCRIPT_DIR/health-check.sh" "http://127.0.0.1:${PORT}/health" 10 3; then
    echo "[rollback] healthy after rollback to $APP_VERSION"
    exit 0
else
    echo "[rollback] STILL unhealthy after rollback to $APP_VERSION — manual intervention required" >&2
    exit 2
fi
