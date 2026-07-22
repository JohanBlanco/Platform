# Notas de sesión — 2026-07-20

> Resumen para retomar el trabajo después de reiniciar la PC.  
> Proyecto: `Spring/Platform/GymPlatform` (backend + web; **sin app móvil**).

---

## Estado del proyecto

| Pieza | Estado |
|-------|--------|
| **Backend** | Spring Boot 3, Java 17, JWT, multi-tenant (un gimnasio) |
| **Web** | React 19 + TypeScript + Vite — único cliente |
| **Mobile** | **Eliminado** (Flutter ya no está en el repo) |
| **BD dev default** | H2 file (`backend/data/gymdb`) — perfil `dev` |
| **BD objetivo** | PostgreSQL — perfil `postgres` |
| **Docker local** | `docker-compose.yml` en la raíz (Postgres 16) |

Código fuente copiado desde `Spring/Java/my-app` → `Platform/GymPlatform`.

---

## Infra objetivo (producción, aún no desplegado)

```
React + Vite  →  Vercel
       ↓
Spring Boot   →  Render
       ↓
PostgreSQL    →  Neon
```

La estructura del monorepo **sí encaja** con ese stack. Falta configurar env vars, CORS en prod y `VITE_API_URL` en Vercel.

---

## Migración H2 → PostgreSQL (hecho en código)

### Archivos clave

| Archivo | Rol |
|---------|-----|
| `application.properties` | Config común; `spring.profiles.active=dev` por defecto |
| `application-dev.properties` | H2 file + consola `/h2-console` |
| `application-postgres.properties` | JDBC PostgreSQL + env `DB_URL`, `DB_USER`, `DB_PASSWORD` |
| `docker-compose.yml` | Postgres local: `gym` / `gymsecret` / BD `gymplatform` |
| `DemoSeedSqlDialect.java` | Traduce SQL demo H2 → PostgreSQL al vuelo |
| `DemoSqlSeeder.java` | Usa traductor si perfil `postgres` |
| `DatabaseSchemaPatch.java` | Solo perfil `dev` (parches H2 legacy) |

### Arranque local con PostgreSQL

```bash
# Terminal 1 — BD
cd GymPlatform
docker compose up -d

# Terminal 2 — API
cd backend
mvn spring-boot:run -Dspring-boot.run.arguments=--spring.profiles.active=postgres

# Terminal 3 — Web
cd web && npm install && npm run dev
```

### Arranque local con H2 (sin Docker)

```bash
cd backend && mvn spring-boot:run
cd web && npm run dev
```

### Credenciales demo

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@gymplatform.local | 12345678 |
| Instructor | instructor@gymplatform.local | instructor123 |
| Recepcionista | recepcion@gymplatform.local | recepcion123 |
| Miembro | miembro@gymplatform.local | miembro123 |

Áreas privadas / estadísticas: `12345678`

---

## Docker (resumen)

- **Qué instalar:** Docker Desktop para Windows.
- **Qué hace:** corre PostgreSQL 16 en un contenedor `gymplatform-pg`, puerto `5432`.
- **Datos persisten** en volumen `gymplatform_pg_data` (se borran con `docker compose down -v`).
- Spring conecta a `jdbc:postgresql://localhost:5432/gymplatform` — no sabe que Postgres está en Docker.

Comandos útiles:

```bash
docker compose up -d      # encender
docker compose ps         # estado (healthy)
docker compose stop       # apagar
docker compose down -v    # reset total de datos
```

---

## Qué instalar (checklist)

- [ ] Java 17+
- [ ] Maven
- [ ] Node.js 18+ (panel web)
- [ ] Docker Desktop (solo para Postgres local)

---

## Importante recordar

1. **Datos H2 no migran solos** a PostgreSQL. Postgres empieza vacío + seeds demo GymPlatform.
2. **`layout--mobile` en web** = diseño responsive del panel, no app Flutter.
3. **`Spring/Java/my-app`** puede seguir existiendo aparte; el repo activo es `Platform/GymPlatform`.
4. **Próximos pasos naturales:** probar Docker + perfil `postgres` → Flyway → despliegue Render/Neon/Vercel.

---

## Documentación relacionada

- [Migrar H2 → PostgreSQL](Migrate-H2-to-PostgreSQL.md)
- [Tech Stack](Tech-Stack.md)
- [Getting Started](Getting-Started.md)
- [Changelog](Changelog.md) — entrada 2026-07-20 (sin móvil + migración PG)

---

## Para retomar en Cursor

Di algo como: *“Retomamos GymPlatform — quiero probar PostgreSQL local con Docker”* o *“Siguiente paso: Flyway / despliegue Render”*.

Esta conversación también queda en el historial de chat de Cursor.

---

## Docker — problemas de instalación (Windows)

Si Docker falla al instalar (p. ej. tras update KB5121767):

→ Guía paso a paso: **[Fix Docker en Windows](Fix-Docker-Windows.md)**

Resumen: terminar Windows Update + reinicio → DISM → habilitar WSL/VirtualMachinePlatform → limpiar `C:\ProgramData\DockerDesktop` → reinstalar Docker como admin.
