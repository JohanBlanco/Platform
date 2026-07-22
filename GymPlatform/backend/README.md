# GymPlatform — Backend

Spring Boot 3 API con tres perfiles de base de datos.

## Perfiles

| Perfil | Motor | Seeds demo | Uso |
|--------|-------|------------|-----|
| `dev` | H2 (archivo `./data/gymdb`) | `db/demo-seed*.sql` | Desarrollo rápido (default) |
| `dev-postgresql` | PostgreSQL local (Docker) | `db/postgres/demo-seed*.sql` | Probar PG en local |
| `dev-postgress` | *(typo tolerado → igual que dev-postgresql)* | | |
| `prod` | PostgreSQL remoto | desactivado | Neon / Render |

> El perfil `postgres` sigue funcionando como alias de `dev-postgresql` (deprecado).  
> **Ojo:** el nombre correcto es `dev-postgresql` (una sola **s**). Si escribes `dev-postgress`, antes caía en H2 vacío y el login fallaba.

Cada perfil define su propio bean `DataSource` en `DataSourceConfiguration.java`.

## Comandos

### 1. dev — H2 (default)

```bash
cd backend
mvn spring-boot:run
```

Equivalente explícito:

```bash
mvn spring-boot:run -Dspring-boot.run.arguments=--spring.profiles.active=dev
```

Consola H2: http://localhost:8080/h2-console  
JDBC: `jdbc:h2:file:./data/gymdb` · user `sa` · sin password

### 2. dev-postgresql — PostgreSQL local

Terminal 1 — base de datos:

```bash
# desde la raíz del repo (GymPlatform/)
docker compose up -d
```

Terminal 2 — API:

```bash
cd backend
mvn clean spring-boot:run -Dspring-boot.run.arguments=--spring.profiles.active=dev-postgresql
```

Si hubo arranques fallidos previos, resetea el volumen:

```bash
docker compose down -v && docker compose up -d
```

Variables opcionales (defaults en `application-dev-postgresql.properties`):

| Variable | Default |
|----------|---------|
| `DB_URL` | `jdbc:postgresql://localhost:5432/gymplatform` |
| `DB_USER` | `gym` |
| `DB_PASSWORD` | `gymsecret` |

### 3. prod — PostgreSQL remoto

Requiere credenciales reales (sin defaults):

```bash
cd backend
export SPRING_PROFILES_ACTIVE=prod
export DB_URL=jdbc:postgresql://HOST:5432/gymplatform
export DB_USER=tu_usuario
export DB_PASSWORD=tu_password
mvn spring-boot:run
```

En Windows (PowerShell):

```powershell
$env:SPRING_PROFILES_ACTIVE="prod"
$env:DB_URL="jdbc:postgresql://HOST:5432/gymplatform"
$env:DB_USER="tu_usuario"
$env:DB_PASSWORD="tu_password"
mvn spring-boot:run
```

`prod` usa `ddl-auto=validate` y **no** carga datos demo FitLife (`app.demo.seed-enabled=false`), pero **sí** crea el admin bootstrap `gymplatformadmin`.

## Seeds SQL

| Motor | Carpeta |
|-------|---------|
| H2 | `src/main/resources/db/demo-seed*.sql` |
| PostgreSQL | `src/main/resources/db/postgres/demo-seed*.sql` |

Tras editar los scripts H2, regenerar la versión PostgreSQL:

```bash
cd backend
mvn test -Dtest=PostgresSeedScriptGeneratorTest
```

Genera también `db/postgres/demo-seed-all.sql` (todos los inserts en un solo archivo).

### Cargar demo completo en PostgreSQL (dev-postgresql)

**Primera vez** (crea esquema JPA + demo automático):

```bash
docker compose up -d
cd backend
mvn spring-boot:run -Dspring-boot.run.arguments=--spring.profiles.active=dev-postgresql
```

**Recargar solo los inserts** (BD ya tiene tablas; p. ej. tras cambiar seeds):

```bash
cd backend
bash scripts/load-postgres-demo.sh
```

Reset total del volumen Docker + recarga manual:

```bash
bash scripts/load-postgres-demo.sh --reset
# Luego arranca el backend una vez para que Hibernate cree el esquema
mvn spring-boot:run -Dspring-boot.run.arguments=--spring.profiles.active=dev-postgresql
```

| Login | Uso |
|-------|-----|
| `gymplatformadmin` / `gymplatformadmin` | Pruebas visuales — **oculto** en listados UI |
| `admin@fitlife.com` / `12345678` | Demo FitLife visible |

Comprueba arranque sin errores en **dev**, **dev-postgresql** y **prod** (local):

```bash
cd backend
bash scripts/verify-profiles.sh
```

Requiere Docker para PostgreSQL. El script limpia H2 dev, resetea el volumen PG y valida login bootstrap.

## Verificación

- API: http://localhost:8080
- Swagger: http://localhost:8080/swagger-ui.html
- Login demo: `gymplatformadmin` / `gymplatformadmin` (todos los perfiles)
- FitLife demo: `admin@fitlife.com` / `12345678` (perfiles `dev` y `dev-postgresql`)
