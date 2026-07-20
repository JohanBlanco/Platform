#!/bin/bash
# Sync rápido de docs cuando el agente termina una tarea
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT" || exit 0

if command -v npm >/dev/null 2>&1; then
  npm run docs:sync:fast --silent 2>/dev/null
elif command -v node >/dev/null 2>&1; then
  node scripts/sync-docs.mjs --fast 2>/dev/null
fi

exit 0
