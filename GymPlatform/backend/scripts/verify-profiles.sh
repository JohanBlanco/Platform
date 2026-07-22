#!/usr/bin/env bash
# Verifica arranque del backend en dev, dev-postgresql y prod (local).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BACKEND="$ROOT/backend"
DOCKER="${DOCKER:-/c/Program Files/Docker/Docker/resources/bin/docker.exe}"
LOG_DIR="${TEMP:-/tmp}/gymplatform-profile-tests"
mkdir -p "$LOG_DIR"

try_start() {
  local profile="$1"
  shift
  local log="$LOG_DIR/start-${profile}.log"
  local extra_args=("$@")
  rm -f "$log"
  echo "=== Probando perfil: $profile ==="

  (cd "$BACKEND" && mvn -q spring-boot:run \
    -Dspring-boot.run.arguments="--spring.profiles.active=${profile} ${extra_args[*]:-}") > "$log" 2>&1 &
  local pid=$!

  for _ in $(seq 1 120); do
    if grep -q "Started GymPlatformApplication" "$log" 2>/dev/null \
        && grep -q "Administrador bootstrap" "$log" 2>/dev/null; then
      if grep -q "Application run failed" "$log" 2>/dev/null; then
        echo "FAIL $profile (arrancó y luego falló)"
        tail -40 "$log"
        kill "$pid" 2>/dev/null || true
        wait "$pid" 2>/dev/null || true
        return 1
      fi
      echo "OK $profile"
      kill "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
      sleep 2
      return 0
    fi
    if grep -q "Application run failed" "$log" 2>/dev/null; then
      echo "FAIL $profile"
      tail -40 "$log"
      kill "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
      return 1
    fi
    sleep 2
  done

  echo "TIMEOUT $profile"
  tail -30 "$log"
  kill "$pid" 2>/dev/null || true
  return 1
}

echo "Compilando..."
(cd "$BACKEND" && mvn -q compile -DskipTests)

echo "Limpiando H2 dev..."
rm -f "$BACKEND/data/gymdb.mv.db" "$BACKEND/data/gymdb.trace.db" 2>/dev/null || true

try_start "dev"

echo "Reiniciando PostgreSQL..."
(cd "$ROOT" && "$DOCKER" compose down -v >/dev/null 2>&1)
(cd "$ROOT" && "$DOCKER" compose up -d)
sleep 5

try_start "dev-postgresql"

export DB_URL="jdbc:postgresql://localhost:5432/gymplatform"
export DB_USER="gym"
export DB_PASSWORD="gymsecret"
try_start "prod"

echo ""
echo "Todos los perfiles arrancaron correctamente."
