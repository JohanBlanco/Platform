# Sincronización automática de documentación

La documentación se actualiza sola en **4 momentos**:

| Cuándo | Qué se actualiza | Comando / trigger |
|--------|------------------|-------------------|
| **Agente Cursor termina** | Timestamps + Changelog | Hook `.cursor/hooks.json` → `stop` |
| **Cada git commit** | OpenAPI + API Ref + Wiki + Notion | `.githooks/post-commit` |
| **Push a main** | Todo + commit de docs al repo | GitHub Action |
| **Swagger** | Siempre al correr backend | http://localhost:8080/swagger-ui.html |

## Configuración inicial (una vez)

```bash
# 1. Dependencias de scripts
npm install

# 2. Git hooks (sync en cada commit)
npm run docs:install-hooks

# 3. Variables opcionales (Wiki + Notion)
cp docs/env.example .env
# Editar .env con tokens
```

### GitHub Secrets (para CI)

En tu repo → Settings → Secrets → Actions:

| Secret | Para qué |
|--------|----------|
| `WIKI_PUSH_TOKEN` | Publicar `docs/wiki/` al GitHub Wiki |
| `NOTION_TOKEN` | Sync del hub a Notion |
| `NOTION_PAGE_ID` | ID de la página GymPlatform |

`WIKI_PUSH_TOKEN`: Personal Access Token con scope `repo`.

### Notion

1. Crear integración en https://www.notion.so/my-integrations
2. Crear página "GymPlatform" y conectar la integración
3. Copiar Page ID de la URL a `NOTION_PAGE_ID`

## Comandos manuales

```bash
npm run docs:sync:fast   # Rápido: timestamps + changelog
npm run docs:sync:full   # Completo: + OpenAPI + Wiki + Notion
npm run docs:export-openapi
npm run docs:update-api
npm run docs:sync-wiki
npm run docs:sync-notion
```

## Qué actualiza cada script

| Script | Salida |
|--------|--------|
| `export-openapi.mjs` | `docs/openapi.json` (desde test Spring Boot) |
| `update-api-reference.mjs` | Tabla de endpoints en `docs/wiki/API-Reference.md` |
| `update-changelog.mjs` | Entrada en `docs/wiki/Changelog.md` por commit |
| `update-timestamps.mjs` | Fecha en páginas wiki |
| `sync-wiki.mjs` | Push a `github.com/OWNER/REPO.wiki.git` |
| `sync-notion.mjs` | Contenido de hub + changelog a Notion |

## Flujo recomendado

```
Código → commit → post-commit hook → docs actualizados
                → push → GitHub Action → wiki + notion + commit docs
Cursor agente termina → hook stop → changelog + timestamps
Backend corre → Swagger UI siempre actualizado
```

## Sin tokens configurados

El sistema sigue funcionando en modo local:
- Swagger: automático al correr backend
- Wiki: archivos en `docs/wiki/` (sin push)
- Notion: plantilla en `docs/notion/` (sin sync)
- Changelog y API Reference: se actualizan en commit
