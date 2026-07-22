#!/usr/bin/env bash
# Arranca el backend con perfil prod usando variables de GymPlatform/.env
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="$ROOT/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Falta $ENV_FILE — copia docs/env.example y completa DB_URL, DB_USER, DB_PASSWORD"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

export SPRING_PROFILES_ACTIVE=prod
export SPRING_JPA_HIBERNATE_DDL_AUTO="${SPRING_JPA_HIBERNATE_DDL_AUTO:-update}"

echo "→ Perfil prod + Neon (ddl-auto=${SPRING_JPA_HIBERNATE_DDL_AUTO})"
cd "$ROOT/backend"
exec mvn spring-boot:run
