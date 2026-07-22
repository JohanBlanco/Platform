# Publicar la Wiki en GitHub

Las páginas viven en **`docs/wiki/`** del repo principal. GitHub Wiki es un **repositorio git separado** (`Platform.wiki`).

**Repo:** [github.com/JohanBlanco/Platform](https://github.com/JohanBlanco/Platform)  
**Wiki (cuando esté publicada):** [github.com/JohanBlanco/Platform/wiki](https://github.com/JohanBlanco/Platform/wiki)

---

## Opción A — Automático (recomendado)

### 1. Activar Wiki en GitHub

1. Ve a **Settings → General → Features**
2. Marca **Wikis**
3. En la pestaña **Wiki**, crea la primera página (puede ser un borrador; el sync la reemplazará)

### 2. Token para push

1. GitHub → **Settings → Developer settings → Personal access tokens**
2. Crea un token con scope **`repo`**
3. En el repo **Platform → Settings → Secrets and variables → Actions**, agrega:
   - `WIKI_PUSH_TOKEN` = el token

### 3. Sincronizar

**En CI (automático):** cada push a `main` que toque `docs/` dispara `.github/workflows/sync-documentation.yml` → `npm run docs:sync:full` → publica la wiki.

**En local (manual):**

```bash
npm install
cp docs/env.example .env
# Editar .env y pegar WIKI_PUSH_TOKEN=ghp_...

npm run docs:sync:full
# o solo wiki:
npm run docs:sync-wiki
```

Si todo va bien verás: `✓ Wiki publicada: https://github.com/JohanBlanco/Platform/wiki`

---

## Opción B — Copia manual (sin token)

1. Repo → pestaña **Wiki** → editar páginas
2. Copia el contenido de cada archivo en `docs/wiki/`:
   - `Home.md` → página principal
   - `Getting-Started.md`, `Testing-Guide.md`, etc.
3. Pega `_Sidebar.md` para el menú lateral

---

## Opción C — Clonar el repo wiki

```bash
git clone https://github.com/JohanBlanco/Platform.wiki.git
cd Platform.wiki

# Desde la raíz del proyecto Platform/GymPlatform
cp docs/wiki/*.md .

git add .
git commit -m "docs: sync wiki from main repo"
git push
```

---

## Mantener sincronizado

| Fuente de verdad | Espejo publicado |
|------------------|------------------|
| `docs/wiki/*.md` en el repo | GitHub Wiki |

Flujo habitual:

1. Editas `docs/wiki/` (o el agente/CI actualiza Changelog, API Reference, etc.)
2. Push a `main` → CI publica wiki (si `WIKI_PUSH_TOKEN` está configurado)
3. O ejecutas `npm run docs:sync-wiki` en local

---

## Sidebar

El archivo `_Sidebar.md` genera el menú lateral en GitHub Wiki.

---

## Enlazar desde el README

```markdown
📖 [Documentación en Wiki](https://github.com/JohanBlanco/Platform/wiki)
```

---

## Notas

- Las imágenes en wiki requieren subirlas al repo wiki o usar URLs externas
- GitHub Wiki no soporta todos los features de Markdown (ej. algunos HTML)
- Sin `WIKI_PUSH_TOKEN`, los archivos siguen en `docs/wiki/` pero **no se publican** solos
