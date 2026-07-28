#!/usr/bin/env bash
# Polls a health endpoint until it responds 200, or gives up after N attempts.
# Usage: health-check.sh <url> [max_attempts] [sleep_seconds]
set -euo pipefail

URL="${1:?Usage: health-check.sh <url> [max_attempts] [sleep_seconds]}"
MAX_ATTEMPTS="${2:-10}"
SLEEP_SECONDS="${3:-3}"

BODY_FILE="$(mktemp)"
trap 'rm -f "$BODY_FILE"' EXIT

for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
    echo "[health-check] attempt ${attempt}/${MAX_ATTEMPTS}: GET ${URL}"

    http_code=$(curl -s -o "$BODY_FILE" -w '%{http_code}' --max-time 5 "$URL" || echo "000")

    if [ "$http_code" = "200" ]; then
        echo "[health-check] OK (200)"
        cat "$BODY_FILE" 2>/dev/null || true
        echo
        exit 0
    fi

    echo "[health-check] got HTTP ${http_code}, retrying in ${SLEEP_SECONDS}s..."
    sleep "$SLEEP_SECONDS"
done

echo "[health-check] FAILED after ${MAX_ATTEMPTS} attempts" >&2
cat "$BODY_FILE" 2>/dev/null || true
exit 1
