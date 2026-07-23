#!/usr/bin/env bash
# Reset H2 local para suite Cypress E2E (BD vacía + seed mínimo al arrancar con perfil e2e)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATA_DIR="$ROOT/backend/data"
echo "Eliminando H2 en $DATA_DIR ..."
rm -f "$DATA_DIR"/gymdb*.db "$DATA_DIR"/gymdb*.trace.db 2>/dev/null || true
STATE_FILE="$ROOT/web/cypress/.local-e2e-state.json"
if [ -f "$STATE_FILE" ]; then
  rm -f "$STATE_FILE"
  echo "Eliminado estado Cypress: $STATE_FILE"
fi
echo "Listo. Arranca el backend con:"
echo "  cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=dev,e2e"
