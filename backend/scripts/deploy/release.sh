#!/usr/bin/env bash
# Atomic, versioned deploy for a single EC2 box.
#
# Layout under BASE_DIR:
#   releases/<release_id>/   - one full checkout + its own node_modules
#   current -> releases/<x>  - symlink the app actually runs from
#   previous -> releases/<y> - symlink to the last-known-good release, for rollback
#   shared/.env              - persists across every release (never in the artifact)
#   shared/ecosystem.config.js
#
# Usage: release.sh <release_id> <tarball_path>
set -euo pipefail

RELEASE_ID="${1:?Usage: release.sh <release_id> <tarball_path>}"
TARBALL="${2:?Usage: release.sh <release_id> <tarball_path>}"

BASE_DIR="/home/ec2-user/backend"
RELEASES_DIR="$BASE_DIR/releases"
RELEASE_DIR="$RELEASES_DIR/$RELEASE_ID"
SHARED_DIR="$BASE_DIR/shared"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KEEP_RELEASES=5

echo "[release] deploying $RELEASE_ID"

mkdir -p "$RELEASES_DIR" "$SHARED_DIR/logs" "$RELEASE_DIR"
tar -xzf "$TARBALL" -C "$RELEASE_DIR"

# Secrets live once in shared/, symlinked into every release — never shipped in the artifact.
ln -sf "$SHARED_DIR/.env" "$RELEASE_DIR/.env"

echo "[release] installing production dependencies"
(cd "$RELEASE_DIR" && npm ci --omit=dev)

# Capture what "current" points at *before* we move it, so we can roll back to it.
PREV_TARGET=""
if [ -L "$BASE_DIR/current" ]; then
    PREV_TARGET="$(readlink "$BASE_DIR/current")"
fi

echo "[release] swapping current -> $RELEASE_DIR"
ln -sfn "$RELEASE_DIR" "$BASE_DIR/current"

if [ -n "$PREV_TARGET" ]; then
    ln -sfn "$PREV_TARGET" "$BASE_DIR/previous"
fi

PORT="$(grep -E '^PORT=' "$SHARED_DIR/.env" 2>/dev/null | cut -d= -f2 || true)"
PORT="${PORT:-8000}"

echo "[release] reloading PM2 (zero-downtime cluster reload)"
export APP_VERSION="$RELEASE_ID"
pm2 startOrReload "$SHARED_DIR/ecosystem.config.js" --update-env

echo "[release] running post-deploy health check"
if bash "$SCRIPT_DIR/health-check.sh" "http://127.0.0.1:${PORT}/health" 10 3; then
    echo "[release] healthy — deploy succeeded ($RELEASE_ID)"

    # Prune old releases, keep the last N (current + previous are always safe,
    # since they're excluded by name and re-derived from the newest entries).
    cd "$RELEASES_DIR"
    # shellcheck disable=SC2012
    ls -1t | tail -n +"$((KEEP_RELEASES + 1))" | while read -r old; do
        echo "[release] pruning old release: $old"
        rm -rf "${RELEASES_DIR:?}/${old:?}"
    done

    exit 0
else
    echo "[release] health check FAILED for $RELEASE_ID" >&2

    if [ -n "$PREV_TARGET" ]; then
        echo "[release] auto-rolling back to $PREV_TARGET" >&2
        bash "$SCRIPT_DIR/rollback.sh"
        exit 1
    else
        echo "[release] no previous release to roll back to (first-ever deploy) — leaving $RELEASE_ID in place for inspection" >&2
        exit 1
    fi
fi
