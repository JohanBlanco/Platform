# Notion — GymPlatform

## Sincronización automática

Si configuras las variables de entorno, Notion se actualiza solo:

```bash
# En .env (copiar desde docs/env.example)
NOTION_TOKEN=secret_...
NOTION_PAGE_ID=abc123...

# Se ejecuta automáticamente en:
# - cada git commit (post-commit hook)
# - push a main (GitHub Action)
# - o manualmente:
npm run docs:sync-notion
```

El script `scripts/sync-notion.mjs` publica:
- Contenido de `docs/notion/GymPlatform-Hub.md`
- Extracto del `Changelog.md`

## Conectar Notion MCP en Cursor

1. Abre **Cursor Settings → MCP**
2. Busca el servidor **Notion**
3. Click **Authenticate** y autoriza tu workspace
4. Una vez conectado, pide al agente: *"Crea la página GymPlatform en Notion desde docs/notion/GymPlatform-Hub.md"*

## Crear el hub manualmente

1. En Notion, crea una página **GymPlatform**
2. Copia el contenido de `GymPlatform-Hub.md`
3. Crea sub-páginas sugeridas:
   - **Uso y pruebas** (contenido de `docs/wiki/Testing-Guide.md`)
   - **Arquitectura** (de `docs/wiki/Architecture.md`)
   - **Roadmap**
   - **Bitácora** (sincronizar con `docs/wiki/Changelog.md`)

## Qué va en Notion vs Wiki vs Swagger

| Contenido | Notion | Wiki | Swagger |
|-----------|:------:|:----:|:-------:|
| Roadmap / ideas | ✅ | ❌ | ❌ |
| Guía de pruebas | ✅ | ✅ | ❌ |
| Arquitectura | ✅ | ✅ | ❌ |
| Endpoints API | link | resumen | ✅ fuente de verdad |
| Changelog | ✅ | ✅ | ❌ |
| Convenciones código | ❌ | ❌ | Cursor Rules |

## Sincronizar en cada sesión

1. Trabajas en el código
2. Actualizas `docs/wiki/Changelog.md`
3. Copias cambios relevantes a Notion (o pides al agente con MCP)
4. Swagger se actualiza solo al reiniciar backend

## Plantilla de entrada en Notion (bitácora)

```
📅 YYYY-MM-DD — Título

✅ Hecho:
- ...

🧪 Cómo probar:
1. ...

📋 Pendiente:
- ...
```
