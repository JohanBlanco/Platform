#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WEB_URL="${GYMPLATFORM_WEB_URL:-http://localhost:5173}"

echo "=== GymPlatform E2E (Selenium) ==="
echo "Web: $WEB_URL"
echo ""
echo "Asegúrate de tener backend (:8080) y web (:5173) corriendo."
echo ""

export GYMPLATFORM_WEB_URL="$WEB_URL"
cd "$ROOT/e2e"
mvn -q test "$@"
