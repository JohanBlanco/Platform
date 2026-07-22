
<!-- AUTO:dbe0c4b9ca434ba0ea1f032777a2345da194af90 -->
## 2026-07-21 — Prevent prod from falling back to embedded H2 when DB env vars are missing.

_Auto-sync desde commit `dbe0c4b`_

### Docs actualizados automáticamente
- [x] Timestamps wiki
- [x] Changelog
- [x] API Reference (si --full)

---

<!-- AUTO:03808f18b74ae11f3688709c1c2bfcc205fbaeb2 -->
## 2026-07-21 — message

_Auto-sync desde commit `03808f1`_

### Docs actualizados automáticamente
- [x] Timestamps wiki
- [x] Changelog
- [x] API Reference (si --full)

---

<!-- AUTO:84b0977ad1cd384fc6b2a961f4a0ff8dff6cdb5c -->
## 2026-07-21 — fix: prepare Docker deploy for Render

_Auto-sync desde commit `84b0977`_

### Docs actualizados automáticamente
- [x] Timestamps wiki
- [x] Changelog
- [x] API Reference (si --full)

---

<!-- AUTO:d4bc5004f245529086d681ef0b5dd2105d37a3f3 -->
## 2026-07-21 — render fix

_Auto-sync desde commit `d4bc500`_

### Docs actualizados automáticamente
- [x] Timestamps wiki
- [x] Changelog
- [x] API Reference (si --full)

---

<!-- AUTO:a7c183381ba5ef66a3e3b6f3cf0d6177f767d9db -->
## 2026-06-25 — completed jdbctemplate module

_Auto-sync desde commit `a7c1833`_

### Docs actualizados automáticamente
- [x] Timestamps wiki
- [x] Changelog
- [x] API Reference (si --full)

---
# Changelog de desarrollo

Bitácora de cambios. Actualizar en cada sesión de trabajo.

## 2026-07-21 — Demo renombrado a GymPlatform

- Organización demo: slug `gymplatform-demo`, nombre **GymPlatform** (sin nombre GTM ficticio).
- Cuentas demo: `@gymplatform.local` (`admin`, `instructor`, `recepcion`, `miembro`).
- Migración automática al arrancar si tenías datos demo antiguos en local.
- **Reset recomendado:** borra `backend/data/gymdb*.db` o `docker compose down -v` para seeds limpios.

---

<!-- AUTO:3a6729479bb3693f5f3403ad8d6ce5995d55b6b9 -->
## 2026-07-21 — fix: move GitHub Actions workflows to repo root

_Auto-sync desde commit `3a67294`_

### Docs actualizados automáticamente
- [x] Timestamps wiki
- [x] Changelog
- [x] API Reference (si --full)

---

## 2026-07-20 — Eliminada app móvil (solo web)

### Qué se hizo
- Eliminado directorio `mobile/` (Flutter).
- Documentación, reglas Cursor y CI actualizados para reflejar solo backend + web.

### Cómo probarlo
1. `cd web && npm run dev` — el panel web sigue siendo el único cliente.
2. Confirmar que no queda carpeta `mobile/` en el repo.

---

## 2026-07-20 — Sin multi-gimnasio; “dueño” → Administrador

### Qué se hizo
- Eliminada la UX de PLATFORM_OWNER (web `/platform`, móvil `platform_screen`, APIs de cliente).
- `/api/platform/**` denegado; login de plataforma rechazado.
- Cuenta demo: `admin@gymplatform.local` (antes `dueno@gymplatform.local`); etiqueta UI **Administrador**.
- Docs y cursor rules actualizados.

### Cómo probarlo
1. Login `admin@gymplatform.local` / `12345678`.
2. Confirmar que no hay menú “Clientes”.
3. `/platform` redirige al inicio.

---

## 2026-07-20 — Documentación técnica (stack, ERD, PostgreSQL, frontend)

### Qué se hizo
- Nuevas páginas wiki: `Tech-Stack`, `Database-ERD`, `Migrate-H2-to-PostgreSQL`, `Frontend`.
- Actualizados índice (`Home`, `_Sidebar`, `docs/README`) y resumen en `Architecture`.

### Cómo usarlo
1. Leer [Tech Stack](Tech-Stack) para el panorama.
2. [ERD](Database-ERD) para el modelo de datos.
3. [Migración PostgreSQL](Migrate-H2-to-PostgreSQL) antes de staging/prod.
4. [Frontend](Frontend) para contribuir al panel web.

---

## 2026-07-19 — Seed de ventas para estadísticas

### Qué se hizo
- Nuevo `db/demo-seed-sales.sql`: cajas, ventas, ítems y pagos (mes actual + anterior).
- `DemoSqlSeeder` carga ventas si GymPlatform no tiene `store_sales`; asegura contraseña de áreas privadas (`12345678`) e indigo.

### Cómo probarlo
1. Reiniciar backend (si ya había gym sin ventas, arranca y carga solo el script de ventas).
2. Login dueño → Estadísticas → desbloquear con `12345678`.
3. Ver KPIs, series, categorías, top productos y métodos de pago.

---

### Qué se hizo
- Fuente de verdad de datos demo: `backend/src/main/resources/db/demo-seed.sql`.
- `DemoSqlSeeder` carga el SQL al arrancar si no existe el gym `gymplatform-demo`.
- El antiguo `DataSeeder` Java quedó desactivado.

### Cómo probarlo
1. Detener backend, borrar `backend/data/gymdb*.db`, arrancar de nuevo.
2. Login `dueno@gymplatform.local` / `12345678` — miembros, actividades, productos, mercadeo.
3. Para agregar data demo: editar `demo-seed.sql` y regenerar la DB.

---

## 2026-07-19 — Catálogo de actividades en Administración

### Qué se hizo
- Nueva sección **Administración → Actividades** (grid con imagen, similar a Productos).
- Las actividades tienen `imageUrl` (subida 1600×900).
- Seed demo asigna imágenes a Boxeo, Zumba, Funcional, Spinning, Yoga, HIIT, Pilates, etc.

### Cómo probarlo
1. Login dueño → Administración → Actividades.
2. Ver tarjetas con imagen; editar o crear una nueva con foto.
3. Reiniciar backend si las imágenes demo no aparecen aún.

---

## 2026-07-19 — Sección Mercadeo (actividades, ofertas, decoración)

### Qué se hizo
- Nuevo menú **Mercadeo** (Admin + Recepción): Promocionar actividades, Promocionar productos, Decoración del mes.
- Promociones de actividades: subir imagen propia (además de URL / sugerencias).
- Ofertas de productos con etiqueta tipo `30% OFF`, vigencia opcional y precio rebajado en el POS.
- Temas estacionales (Navidad, Halloween, San Valentín, etc.) que decoran toda la web.
- La gestión de promociones salió de Inicio / Agenda y vive solo en Mercadeo.

### Cómo probarlo
1. Login como `dueno@gymplatform.local` / `12345678` → menú **Mercadeo**.
2. En Actividades: subir una imagen a un espacio del carrusel.
3. En Productos: crear oferta 30% OFF y verificar etiqueta en Punto de venta.
4. En Decoración: aplicar Navidad o Halloween y ver el borde/ambiente en la app.
5. Perfil Miembro: verificar carrusel de actividades promocionadas.

---

## 2026-07-19 — Promociones y retención de actividades

### Qué se hizo
- Las actividades y citas terminadas se conservan un mes y luego se eliminan automáticamente.
- El dueño puede configurar hasta tres actividades promocionadas desde Agenda → Actividades.
- Cada promoción admite imagen por URL o sugerencias visuales.
- El inicio del miembro muestra un carrusel; sin promociones manuales usa las tres actividades más reservadas.

### Cómo probarlo
1. Entrar como dueño y abrir Agenda → Actividades.
2. Configurar uno de los tres espacios promocionales.
3. Entrar con perfil Miembro y verificar el carrusel antes de “Actividades disponibles”.
4. Vaciar los tres espacios y comprobar el fallback automático.

---

## 2026-07-10 — Contraseña por defecto y dueño al crear gimnasio

### Qué se hizo
- Al crear un cliente se crea automáticamente un `GYM_OWNER` con el correo de contacto
- Contraseña inicial por defecto: `12345678` (gimnasios nuevos y usuarios staff sin password)
- Formulario web de usuarios en Administración del gimnasio
- Documentación actualizada (wiki, README, Notion, Swagger)

### Cómo probarlo
1. Login como `admin@gymplatform.com` / `admin123`
2. Crear cliente con correo de contacto nuevo
3. Login con ese correo y `12345678`
4. En Administración → crear instructor sin password → login con `12345678`

---

## 2026-07-10 — Setup inicial de documentación multi-canal

### Qué se hizo
- Plataforma GymPlatform creada: backend, web, móvil
- Documentación distribuida en 4 canales:
  - **Swagger** — OpenAPI en `/swagger-ui.html`
  - **GitHub Wiki** — páginas en `docs/wiki/`
  - **Notion** — plantilla en `docs/notion/GymPlatform-Hub.md`
  - **Cursor Rules** — `.cursor/rules/*.mdc`

### Cómo probar
1. `cd backend && mvn spring-boot:run`
2. Abrir http://localhost:8080/swagger-ui.html
3. `cd web && npm run dev` → http://localhost:5173
4. Seguir checklists en [Testing-Guide](Testing-Guide)

### 2026-07-10 — Automatización de documentación

### Qué se hizo
- Scripts `npm run docs:sync:fast` y `docs:sync:full`
- Git hook post-commit para sync completo
- Cursor hook `stop` para sync rápido al terminar agente
- GitHub Action `sync-documentation.yml`
- Export automático OpenAPI → `docs/openapi.json` → API Reference wiki
- Sync opcional a GitHub Wiki y Notion vía tokens

### Cómo activar
```bash
npm install && npm run docs:install-hooks
cp docs/env.example .env  # opcional
```

### Docs
- [AUTOMATION.md](../AUTOMATION.md)

---
- [ ] RBAC fino por rol en backend
- [ ] Suscripciones de miembros a paquetes
- [ ] Tests automatizados

---

## Plantilla para nuevas entradas

```markdown
## YYYY-MM-DD — Título

### Qué se hizo
- ...

### Cómo probar
1. ...

### Docs actualizados
- [ ] Swagger
- [ ] Wiki: (páginas)
- [ ] Notion
- [ ] Cursor rules

### Pendiente
- [ ] ...
```
