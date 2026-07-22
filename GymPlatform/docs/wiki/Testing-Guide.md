# Guía de pruebas

Checklists manuales por rol y **cómo ejecutar la suite automatizada** en local y CI.

---

## Cómo ejecutar los tests

### 1. Backend (unit + integración H2)

No requiere Docker ni servicios externos.

```bash
cd backend
mvn test
```

| Comando | Qué hace |
|---------|----------|
| `mvn test` | Tests con H2 en memoria (perfil `test`) |
| `mvn -Ppostgres-it test -Dtest=PostgresIntegrationTest` | Integración con PostgreSQL vía Testcontainers (requiere Docker) |

**CI:** `.github/workflows/tests.yml` corre `mvn test` en cada push/PR a `main`.

---

### 2. E2E Selenium (usuario final)

Simula clics reales en la web. **Requiere 3 procesos en paralelo:**

**Terminal 1 — API**

```bash
cd backend
mvn spring-boot:run
# o con PostgreSQL demo:
# mvn spring-boot:run -Dspring-boot.run.arguments=--spring.profiles.active=dev-postgresql
```

**Terminal 2 — Web**

```bash
cd web
npm install
npm run dev
```

**Terminal 3 — E2E**

```bash
cd e2e
mvn test
```

Atajo (solo corre tests; tú debes tener backend `:8080` y web `:5173` arriba):

```bash
bash e2e/scripts/run-e2e.sh
```

| Variable | Default | Uso |
|----------|---------|-----|
| `GYMPLATFORM_WEB_URL` | `http://localhost:5173` | URL de la SPA si no es localhost |

**Nota:** Los E2E no corren en CI por defecto (Chrome + servicios). Ver `e2e/README.md`.

---

### 3. Scripts QA manuales → automatización

Los casos `TC-*` están en [`docs/qa/manual-test-scripts.md`](../qa/manual-test-scripts.md) y se mapean a clases en `e2e/src/test/java/com/gymplatform/e2e/qa/`.

| Escenario E2E | Clase |
|---------------|-------|
| Jornada de ventas (caja, POS, ingresos/gastos) | `SalesDayFlowSeleniumTest` |
| CRUD usuarios | `UsersCrudSeleniumTest` |
| CRUD productos | `ProductsCrudSeleniumTest` |
| CRUD membresías | `MembershipsCrudSeleniumTest` |
| CRUD actividades | `ActivitiesCrudSeleniumTest` |
| Miembro: reservas, citas, rutina | `MemberServicesSeleniumTest` |
| Instructor: citas y rutinas | `InstructorWorkflowSeleniumTest` |
| Login y navegación por rol | `LoginFlowSeleniumTest`, `RoleNavigationSeleniumTest` |

---

## Automatizado (resumen)

| Capa | Comando | Ubicación |
|------|---------|-----------|
| Unit + integración (H2) | `cd backend && mvn test` | `backend/src/test/java` |
| Integración PostgreSQL | `mvn -Ppostgres-it test -Dtest=PostgresIntegrationTest` | Testcontainers |
| E2E Selenium | `cd e2e && mvn test` (backend + web arriba) | `e2e/` |
| Scripts QA manuales → auto | Ver `docs/qa/manual-test-scripts.md` | IDs TC-* |

CI: `.github/workflows/tests.yml` ejecuta backend H2 y PG en cada push/PR.

---

## Pre-requisitos (pruebas manuales web)

- [ ] Backend corriendo en `:8080`
- [ ] Web corriendo en `:5173`
- [ ] Swagger accesible en `/swagger-ui.html`

---

## Administrador (`GYM_OWNER`)

**Login:** `admin@gymplatform.local` / `12345678`

### Web — Administración

- [ ] Ver sección **Administración** en sidebar
- [ ] Listar planes / membresías
- [ ] Crear usuario staff o miembro
- [ ] Estadísticas: desbloquear con `12345678`
- [ ] Switch de perfil → Miembro: ver rutinas/citas/nutrición del admin

### API (Swagger)

- [ ] `GET /api/packages`
- [ ] `POST /api/packages` (con array `addons`)
- [ ] `POST /api/activities` — crear actividad con cupo
- [ ] `POST /api/users` — crear instructor o miembro

### Resultado esperado

Operaciones scoped al `organizationId` del JWT (GymPlatform demo).

---

## Instructor

**Login:** `instructor@gymplatform.local` / `instructor123`

### Web

- [ ] Ver actividades del gimnasio
- [ ] Ver solicitudes de rutina pendientes
- [ ] Tomar una solicitud (cambia a IN_PROGRESS)

### API (Swagger)

- [ ] `POST /api/routine-templates` — crear plantilla con ejercicios
- [ ] `GET /api/routine-templates`
- [ ] `POST /api/routines` — rutina individual
- [ ] `POST /api/routines/assign-template`
- [ ] `PUT /api/routine-requests/{id}/status`

---

## Miembro

**Login:** `miembro@gymplatform.local` / `miembro123`

### Web

- [ ] Inicio con carrusel solo si hay promociones
- [ ] Reservar una actividad
- [ ] Ver mis actividades / citas
- [ ] Ver rutinas, nutrición y medidas
- [ ] Solicitar nueva rutina
- [ ] Editar perfil

---

## Recepcionista

**Login:** `recepcion@gymplatform.local` / `recepcion123`

- [ ] Usuarios, productos, POS
- [ ] No debe entrar a estadísticas (solo administrador)

---

## Regresión rápida

- [ ] Login administrador → home staff
- [ ] Login miembro → home + servicios
- [ ] `/platform` redirige a `/` (ya no hay clientes)
- [ ] `admin@gymplatform.com` no puede iniciar sesión (cuenta desactivada / no disponible)
