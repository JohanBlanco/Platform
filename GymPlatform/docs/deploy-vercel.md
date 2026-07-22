# Vercel — Panel web (React + Vite)

## 1. Conectar repo

1. [vercel.com/new](https://vercel.com/new) → Import Git Repository → `JohanBlanco/Platform`
2. **Root Directory:** `GymPlatform/web` (Edit → Root Directory)
3. Framework Preset: **Vite** (auto-detectado)
4. Build Command: `npm run build`
5. Output Directory: `dist`

## 2. Variable de entorno (obligatoria)

En **Environment Variables** antes del primer deploy:

| Variable | Valor |
|----------|--------|
| `VITE_API_URL` | `https://TU-SERVICIO.onrender.com/api` |

Reemplaza `TU-SERVICIO` por la URL real de Render (ej. `gymplatform-api.onrender.com`).

> Debe terminar en `/api` — la app concatena rutas como `/auth/login`.

## 3. Deploy

Deploy → espera el build → abre la URL `https://tu-proyecto.vercel.app`

## 4. CORS en Render (después del deploy web)

En Render → Environment, actualiza:

```env
APP_CORS_ALLOWED_ORIGINS=https://tu-proyecto.vercel.app,http://localhost:5173,http://127.0.0.1:5173
APP_PUBLIC_BASE_URL=https://tu-proyecto.vercel.app
```

Guarda y redeploy la API.

## 5. Probar

- Login prod: `gymplatformadmin` / `gymplatformadmin`
- Si falla con error de red → revisa `VITE_API_URL` y CORS
- Si 401 en rutas → token OK; revisa credenciales

## Archivos del proyecto

- `web/vercel.json` — rewrites SPA (React Router)
- `web/.env.example` — plantilla de `VITE_API_URL`
