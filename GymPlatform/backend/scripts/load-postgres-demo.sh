#!/usr/bin/env bash
# Carga todo el demo H2 traducido a PostgreSQL (datos visibles en la web).
# Uso: bash scripts/load-postgres-demo.sh [--reset]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BACKEND="$ROOT/backend"
SEED_DIR="$BACKEND/src/main/resources/db/postgres"
DOCKER="${DOCKER:-/c/Program Files/Docker/Docker/resources/bin/docker.exe}"
CONTAINER="${PG_CONTAINER:-gymplatform-pg}"
DB_USER="${DB_USER:-gym}"
DB_NAME="${DB_NAME:-gymplatform}"

ORDERED=(
  demo-seed.sql
  demo-seed-sales.sql
  demo-seed-member.sql
  demo-seed-member-staff.sql
)

if [[ "${1:-}" == "--reset" ]]; then
  echo "Reseteando PostgreSQL..."
  (cd "$ROOT" && "$DOCKER" compose down -v)
  (cd "$ROOT" && "$DOCKER" compose up -d)
  echo "Esperando PostgreSQL..."
  sleep 6
fi

if ! "$DOCKER" ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "Contenedor $CONTAINER no está corriendo. Ejecuta: docker compose up -d"
  exit 1
fi

echo "Generando scripts PG desde H2 (si hace falta)..."
(cd "$BACKEND" && mvn -q test -Dtest=PostgresSeedScriptGeneratorTest)

if [[ -f "$SEED_DIR/demo-seed-all.sql" ]]; then
  echo "Cargando demo-seed-all.sql ..."
  "$DOCKER" exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 \
    < "$SEED_DIR/demo-seed-all.sql"
else
  echo "Cargando scripts individuales en orden..."
  for file in "${ORDERED[@]}"; do
    path="$SEED_DIR/$file"
    if [[ ! -f "$path" ]]; then
      echo "Falta $path — ejecuta mvn test -Dtest=PostgresSeedScriptGeneratorTest"
      exit 1
    fi
    echo "  → $file"
    "$DOCKER" exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 < "$path"
  done
fi

echo ""
echo "Demo PostgreSQL cargado."
echo "Arranca: mvn spring-boot:run -Dspring-boot.run.arguments=--spring.profiles.active=dev-postgresql"
echo "Login oculto (pruebas): gymplatformadmin / gymplatformadmin"
echo "Login demo visible:       admin@gymplatform.local / 12345678"
