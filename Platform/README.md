# Platform Landing

Landing page de **Platform** — soluciones digitales para pequeños negocios.

## Desarrollo

```bash
npm install
npm run dev
```

Abre http://localhost:5173

## Variables de entorno

Opcional: en `.env` define la URL de GymPlatform:

```
VITE_GYM_PLATFORM_URL=https://tu-app.vercel.app/login
```

## Build

```bash
npm run build
npm run preview
```

## Deploy en Vercel

1. Importa el repo de GitHub en [vercel.com](https://vercel.com).
2. En **Root Directory**, pon: `Platform`
3. Framework Preset: **Vite** (Vercel lo detecta solo).
4. Usa estos valores en **Build and Output Settings**:

| Campo | Valor |
|-------|-------|
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

No uses `npm run dev` — eso solo corre el servidor local, no genera el sitio para producción.

5. (Opcional) En **Environment Variables** agrega:

```
VITE_GYM_PLATFORM_URL=https://tu-gymplatform.vercel.app/login
```

6. Deploy.

El archivo `vercel.json` ya incluye el rewrite para SPA.
