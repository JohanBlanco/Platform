# GymPlatform

Plataforma SaaS multi-tenant para administración de gimnasios.

## Inicio rápido

```bash
# 1. API (perfil dev = H2, default)
cd backend && mvn spring-boot:run

# 2. Web
cd web && npm install && npm run dev
```

### Perfiles de base de datos

| Perfil | Comando |
|--------|---------|
| **dev** (H2, default) | `cd backend && mvn spring-boot:run` |
| **dev-postgresql** | `docker compose up -d` luego `cd backend && mvn spring-boot:run -Dspring-boot.run.arguments=--spring.profiles.active=dev-postgresql` |
| **prod** | `SPRING_PROFILES_ACTIVE=prod DB_URL=... DB_USER=... DB_PASSWORD=... mvn spring-boot:run` |

Detalle completo: [backend/README.md](backend/README.md)

### Verificar los 3 perfiles (arranque sin errores)

```bash
cd backend && bash scripts/verify-profiles.sh
```

- API: http://localhost:8080
- Swagger: http://localhost:8080/swagger-ui.html
- Web: http://localhost:5173

## Documentación

| Canal | Link |
|-------|------|
| **Automatización** | [docs/AUTOMATION.md](docs/AUTOMATION.md) |
| **Índice completo** | [docs/README.md](docs/README.md) |
| **Guía de pruebas** | [docs/wiki/Testing-Guide.md](docs/wiki/Testing-Guide.md) · [Wiki](https://github.com/JohanBlanco/Platform/wiki/Testing-Guide) |
| **Swagger (API)** | http://localhost:8080/swagger-ui.html |
| **GitHub Wiki** | [github.com/JohanBlanco/Platform/wiki](https://github.com/JohanBlanco/Platform/wiki) — ver [SETUP-WIKI.md](docs/wiki/SETUP-WIKI.md) |
| **Notion** | Auto-sync con `NOTION_TOKEN` |
| **Cursor Rules** | [.cursor/rules/](.cursor/rules/) |

## Tests

```bash
# Backend (unit + integración H2)
cd backend && mvn test

# E2E Selenium — requiere backend :8080 + web :5173 en otras terminales
cd e2e && mvn test
```

Detalle: [docs/wiki/Testing-Guide.md](docs/wiki/Testing-Guide.md) · [e2e/README.md](e2e/README.md)

### Activar auto-sync (una vez)

```bash
npm install && npm run docs:install-hooks
```

## Estructura

```
GymPlatform/
├── backend/        Spring Boot 3 + JWT
├── web/            React + Vite
├── docs/           Wiki, Notion, índice
└── .cursor/rules/  Convenciones para IA
```

## Cuentas demo

| Uso | Login | Contraseña |
|-----|-------|------------|
| **Bootstrap (todos los perfiles)** | `gymplatformadmin` | `gymplatformadmin` |
| **GymPlatform demo** (`dev` / `dev-postgresql`) | `admin@gymplatform.local` | `12345678` |
| Instructor demo | `instructor@gymplatform.local` | `instructor123` |
| Recepcionista demo | `recepcion@gymplatform.local` | `recepcion123` |
| Miembro demo | `miembro@gymplatform.local` | `miembro123` |

**Contraseña por defecto** al crear un usuario staff (sin indicar password): `12345678`
