# Documentación GymPlatform

Este directorio centraliza toda la documentación del proyecto.

## Canales

| Canal | Ubicación | Actualización |
|-------|-----------|---------------|
| **Swagger** | http://localhost:8080/swagger-ui.html | Automática (runtime) |
| **GitHub Wiki** | `docs/wiki/` | Auto en commit/CI |
| **Notion** | `docs/notion/` + API | Auto si `NOTION_TOKEN` configurado |
| **Cursor Rules** | `.cursor/rules/` | Manual |
| **Auto-sync** | [AUTOMATION.md](AUTOMATION.md) | **Guía de automatización** |

## Índice Wiki

- [Home](wiki/Home.md) — página principal
- [Getting Started](wiki/Getting-Started.md) — cómo levantar el proyecto
- [Testing Guide](wiki/Testing-Guide.md) — checklists por rol
- [Tech Stack](wiki/Tech-Stack.md) — tecnologías y diagramas
- [Architecture](wiki/Architecture.md) — diseño del sistema
- [Database ERD](wiki/Database-ERD.md) — modelo de datos
- [Migrate H2 → PostgreSQL](wiki/Migrate-H2-to-PostgreSQL.md) — guía de migración
- [Frontend](wiki/Frontend.md) — panel React
- [API Reference](wiki/API-Reference.md) — resumen de endpoints (+ Swagger)
- [Roles and Permissions](wiki/Roles-and-Permissions.md) — matriz de permisos
- [Changelog](wiki/Changelog.md) — bitácora de desarrollo

## Publicar Wiki en GitHub

Ver [SETUP-WIKI.md](wiki/SETUP-WIKI.md)

## Notion

Ver [notion/README.md](notion/README.md) para conectar MCP y crear el hub.

## Mantenimiento

Al hacer cambios en el app, sigue el checklist en `.cursor/rules/documentation-sync.mdc`:

1. Swagger (anotaciones en controllers)
2. Wiki (páginas afectadas + Changelog)
3. Notion (estado y bitácora)
4. README (solo si cambia inicio rápido)
