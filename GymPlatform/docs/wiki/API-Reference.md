# Referencia API

> **Fuente de verdad interactiva:** [Swagger UI](http://localhost:8080/swagger-ui.html)

## Autenticación

1. `POST /api/auth/login` con `{ "email", "password" }`
2. Copiar `token` de la respuesta
3. En Swagger: **Authorize** → `Bearer <token>`

## Endpoints públicos (sin token)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register/{organizationId}` | Registro miembro |
| GET | `/api/public/organizations` | Gimnasios activos (p. ej. registro) |

> `/api/platform/**` está **deshabilitado** (ya no hay gestión multi-cliente).

## Gimnasio (requiere JWT con organizationId)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | `/api/users` | Usuarios staff |
| GET | `/api/users/me` | Perfil actual |
| PUT | `/api/users/me/profile` | Actualizar perfil miembro |
| GET/POST | `/api/packages` | Paquetes + addons |
| GET/POST | `/api/activities` | Actividades |
| GET | `/api/activities/{id}` | Detalle actividad |
| POST | `/api/activities/{id}/reservations` | Reservar |
| POST | `/api/reservations/{id}/confirm` | Confirmar |
| POST | `/api/reservations/{id}/cancel` | Cancelar |
| GET | `/api/reservations/me` | Mis reservaciones |
| GET | `/api/activities/{id}/reservations` | Reservaciones de actividad |
| GET/POST | `/api/routine-templates` | Plantillas |
| POST | `/api/routines` | Crear rutina |
| POST | `/api/routines/assign-template` | Asignar plantilla |
| GET | `/api/routines/me` | Mis rutinas |
| GET/POST | `/api/routine-requests` | Solicitudes |
| PUT | `/api/routine-requests/{id}/status` | Actualizar estado |

## OpenAPI JSON

Descarga el spec en: http://localhost:8080/v3/api-docs

## Probar con curl

```bash
# Login
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"miembro@fitlife.com","password":"miembro123"}'

# Usar token
curl -s http://localhost:8080/api/activities \
  -H "Authorization: Bearer <TOKEN>"
```

## Mantenimiento

Al agregar endpoints:
1. Anotar controller con `@Tag`
2. Verificar en Swagger UI
3. Ejecutar `npm run docs:sync:full` (actualiza esta sección automáticamente)
4. Registrar en [Changelog](Changelog)

## Endpoints (auto-generado)

<!-- AUTO-GENERATED:START -->
_Generado automáticamente el 2026-07-11 desde `docs/openapi.json`_

### Gimnasio

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/activities` | getActivities |
| POST | `/api/activities` | createActivity |
| GET | `/api/activities/{activityId}/reservations` | activityReservations |
| POST | `/api/activities/{activityId}/reservations` | createReservation |
| GET | `/api/activities/{id}` | getActivity |
| GET | `/api/packages` | getPackages |
| POST | `/api/packages` | createPackage |
| GET | `/api/packages/{id}` | getPackage |
| PUT | `/api/packages/{id}` | updatePackage |
| POST | `/api/reservations/{id}/cancel` | cancelReservation |
| POST | `/api/reservations/{id}/confirm` | confirmReservation |
| GET | `/api/reservations/me` | myReservations |
| GET | `/api/routine-requests` | getRoutineRequests |
| POST | `/api/routine-requests` | createRoutineRequest |
| PUT | `/api/routine-requests/{id}/status` | updateRoutineRequestStatus |
| GET | `/api/routine-templates` | getTemplates |
| POST | `/api/routine-templates` | createTemplate |
| POST | `/api/routines` | createRoutine |
| POST | `/api/routines/assign-template` | assignTemplate |
| GET | `/api/routines/me` | myRoutines |
| GET | `/api/users` | getUsers |
| POST | `/api/users` | Crear usuario del gimnasio |
| PUT | `/api/users/{id}` | Actualizar usuario del gimnasio |
| GET | `/api/users/me` | getMyProfile |
| PUT | `/api/users/me/profile` | updateMyProfile |

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | login |
| POST | `/api/auth/register/{organizationId}` | register |

### Público

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/public/organizations` | listActiveOrganizations |

<!-- AUTO-GENERATED:END -->
