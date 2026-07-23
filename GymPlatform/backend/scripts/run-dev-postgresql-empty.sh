#!/usr/bin/env bash
# PostgreSQL vacío + backend sin seeds demo.
# Uso (desde backend/): bash scripts/run-dev-postgresql-empty.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> Reiniciando PostgreSQL (volumen limpio)…"
docker compose down -v
docker compose up -d

echo "==> Esperando PostgreSQL…"
for i in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U gym -d gymplatform >/dev/null 2>&1; then
    echo "    PostgreSQL listo."
    break
  fi
  if [[ "$i" -eq 30 ]]; then
    echo "PostgreSQL no respondió a tiempo." >&2
    exit 1
  fi
  sleep 1
done

cd "$ROOT/backend"
echo "==> Arrancando API (perfil dev-postgresql-empty)…"
exec mvn spring-boot:run -Dspring-boot.run.arguments=--spring.profiles.active=dev-postgresql-empty
