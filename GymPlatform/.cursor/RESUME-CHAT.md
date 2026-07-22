# Retomar conversación — GymPlatform

> Archivo auto-generado para continuar en el IDE con el proyecto abierto.
> En Cursor: **Ctrl+L** → historial (icono reloj) → busca chats recientes de este repo.

## Hecho en la sesión anterior

- Tests backend + E2E Selenium documentados (`docs/wiki/Testing-Guide.md`)
- GitHub Wiki publicada: https://github.com/JohanBlanco/Platform/wiki
- Workflows movidos a `Platform/.github/workflows/` (raíz del repo git)
- Secret `WIKI_PUSH_TOKEN` funciona vía GitHub Actions

## Próximo objetivo acordado

**Migrar a la nube (gratis, sin administrar servidores):**

| Orden | Capa | Servicio | Estado |
|-------|------|----------|--------|
| 1 | PostgreSQL | Neon (`summer-unit-50332044`) | ✅ Conectado (`.env` + esquema en la nube) |
| 2 | API Spring Boot | Render | Pendiente |
| 3 | Web React | Vercel | Pendiente |

Integrar las 3 capas con env vars:

- Web → `VITE_API_URL` (Vercel)
- API → `DB_URL`, `DB_USER`, `DB_PASSWORD` (Render → Neon)
- API → `APP_CORS_ALLOWED_ORIGINS`, `APP_PUBLIC_BASE_URL` (URL de Vercel)
- API → `APP_JWT_SECRET`, `APP_SECRETS_ENCRYPTION_KEY`

**Nota prod:** primera vez en BD vacía usar `SPRING_JPA_HIBERNATE_DDL_AUTO=update`; luego `validate`.

**Neon opcional:** `npx neonctl@latest init` desde esta carpeta (setup Cursor + MCP).

## Para continuar con el Agent

Di en el chat:

> Retomamos migración a la nube — paso 1 Neon
