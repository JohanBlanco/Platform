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
  -d '{"email":"miembro@gymplatform.local","password":"miembro123"}'

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
_Generado automáticamente el 2026-07-22 desde `docs/openapi.json`_

### Gimnasio

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/activities` | getActivities |
| POST | `/api/activities` | createActivity |
| GET | `/api/activities/{activityId}/reservations` | activityReservations |
| POST | `/api/activities/{activityId}/reservations` | createReservation |
| GET | `/api/activities/{id}` | getActivity |
| PUT | `/api/activities/{id}` | updateActivity |
| DELETE | `/api/activities/{id}` | Cancelar actividad por emergencia |
| GET | `/api/activities/{id}/cancel-impact` | Reservaciones afectadas al cancelar |
| POST | `/api/activities/{id}/occurrence-cancel` | Cancelar ocurrencia o serie |
| POST | `/api/activities/{id}/occurrence-delete` | Eliminar ocurrencia o serie del calendario |
| PUT | `/api/activities/{id}/occurrence-edit` | Editar ocurrencia desde calendario |
| POST | `/api/activities/{id}/occurrence-restore` | Reactivar ocurrencia o serie cancelada |
| GET | `/api/activities/{id}/reservation-impact` | Reservaciones activas antes de eliminar |
| POST | `/api/activities/{id}/reservation-impact/preview` | Vista previa de reservaciones afectadas al editar |
| POST | `/api/activities/{id}/restore` | Reactivar actividad cancelada por emergencia |
| PUT | `/api/activity-promotions/{slotIndex}` | Configurar un espacio promocional (admin o recepción) |
| DELETE | `/api/activity-promotions/{slotIndex}` | Vaciar un espacio promocional (admin o recepción) |
| GET | `/api/activity-promotions/admin` | Tres espacios de actividades promocionadas para administración |
| GET | `/api/activity-promotions/home` | Promociones del inicio del miembro |
| GET | `/api/appointment-requests` | Listar solicitudes de cita del gimnasio (staff) |
| POST | `/api/appointment-requests` | Crear solicitud de cita (medición, nutrición, rutina o consulta) |
| PUT | `/api/appointment-requests/{id}/accept` | Aceptar / confirmar solicitud de cita |
| PUT | `/api/appointment-requests/{id}/reject` | Rechazar solicitud de cita |
| PUT | `/api/appointment-requests/{id}/schedule` | Actualizar horario de una cita |
| PUT | `/api/appointment-requests/{id}/status` | Actualizar estado de solicitud de cita |
| GET | `/api/appointment-requests/me` | Mis solicitudes de cita |
| POST | `/api/body-measurements` | Registrar medidas corporales de un miembro |
| GET | `/api/body-measurements/{id}` | Detalle de una medición |
| GET | `/api/body-measurements/me` | Mis medidas corporales |
| GET | `/api/body-measurements/member/{memberId}` | Historial de medidas de un miembro |
| POST | `/api/body-measurements/preview` | Vista previa del análisis sin guardar |
| GET | `/api/broadcast/settings/{channel}` | Configuración de canal WhatsApp |
| PUT | `/api/broadcast/settings/{channel}` | Actualizar configuración de canal WhatsApp |
| GET | `/api/broadcast/templates/{channel}` | Plantillas de mensajes WhatsApp |
| POST | `/api/broadcast/templates/{channel}` | Crear plantilla de mensaje |
| PUT | `/api/broadcast/templates/{channel}/{id}` | Actualizar plantilla de mensaje |
| DELETE | `/api/broadcast/templates/{channel}/{id}` | Eliminar plantilla de mensaje |
| GET | `/api/exercises` | Catálogo de ejercicios |
| POST | `/api/exercises` | Agregar ejercicio al catálogo |
| DELETE | `/api/exercises/{id}` | Eliminar ejercicio del catálogo |
| GET | `/api/forms` | Listar formularios del gimnasio |
| POST | `/api/forms` | Crear formulario |
| GET | `/api/forms/{id}` | Obtener formulario |
| PUT | `/api/forms/{id}` | Actualizar formulario |
| DELETE | `/api/forms/{id}` | Eliminar formulario |
| POST | `/api/forms/{id}/submit` | Enviar respuestas de formulario (usuarios autenticados) |
| GET | `/api/forms/folders` | Listar carpetas de formularios |
| POST | `/api/forms/folders` | Crear carpeta de formularios |
| GET | `/api/forms/response-folders/{folderId}/submissions` | Listar respuestas de una carpeta |
| GET | `/api/forums` | Listar foros |
| GET | `/api/forums/{slug}/topics` | Listar temas de un foro |
| GET | `/api/forums/exercises/by-exercise/{exerciseId}` | Guía de foro por ejercicio del catálogo |
| GET | `/api/forums/topics/{topicId}` | Detalle de un tema del foro |
| GET | `/api/instructors` | Listar instructores del gimnasio |
| GET | `/api/member-files` | Expedientes de miembros con formularios completados |
| GET | `/api/member-files/users/{userId}` | Expediente de un miembro |
| GET | `/api/member-files/users/{userId}/{submissionId}` | Detalle de archivo de formulario para PDF |
| POST | `/api/nutrition-plans` | Crear plan nutricional para un miembro |
| GET | `/api/nutrition-plans/{id}` | Detalle de un plan nutricional |
| PUT | `/api/nutrition-plans/{id}` | Actualizar plan nutricional |
| POST | `/api/nutrition-plans/{id}/archive` | Archivar plan nutricional |
| GET | `/api/nutrition-plans/active` | Planes activos del gimnasio |
| GET | `/api/nutrition-plans/me` | Mis planes nutricionales |
| GET | `/api/nutrition-plans/member/{memberId}` | Planes nutricionales de un miembro |
| GET | `/api/organization` | Perfil / branding del gimnasio actual |
| PUT | `/api/organization` | Actualizar perfil del gimnasio (solo admin; requiere contraseña) |
| GET | `/api/packages` | getPackages |
| POST | `/api/packages` | createPackage |
| GET | `/api/packages/{id}` | getPackage |
| PUT | `/api/packages/{id}` | updatePackage |
| GET | `/api/product-categories` | Categorías de productos de la tienda |
| POST | `/api/product-categories` | Crear categoría de producto |
| GET | `/api/products` | Listar productos de la tienda |
| POST | `/api/products` | Crear producto |
| GET | `/api/products/{id}` | Detalle de producto |
| PUT | `/api/products/{id}` | Actualizar producto |
| DELETE | `/api/products/{id}` | Eliminar producto (soft delete) |
| GET | `/api/products/image-suggestions` | Sugerencias de imagen de producto (búsqueda web / empaque) |
| POST | `/api/reservations/{id}/cancel` | cancelReservation |
| POST | `/api/reservations/{id}/confirm` | confirmReservation |
| POST | `/api/reservations/{id}/mark-paid` | Marcar reservación como pagada |
| GET | `/api/reservations/me` | myReservations |
| GET | `/api/reservations/pending-payment` | Reservaciones con pago pendiente |
| GET | `/api/routine-requests` | Listar solicitudes de rutina |
| POST | `/api/routine-requests` | createRoutineRequest |
| POST | `/api/routine-requests/{id}/assign-template` | Asignar plantilla y completar solicitud |
| POST | `/api/routine-requests/{id}/draft` | Guardar progreso de rutina (solicitud En progreso) |
| POST | `/api/routine-requests/{id}/fulfill` | Crear rutina personalizada y completar solicitud |
| PUT | `/api/routine-requests/{id}/status` | updateRoutineRequestStatus |
| GET | `/api/routine-templates` | getTemplates |
| POST | `/api/routine-templates` | createTemplate |
| PUT | `/api/routine-templates/{id}` | Actualizar plantilla de rutina |
| GET | `/api/routines` | Listar rutinas del gimnasio (staff) |
| POST | `/api/routines` | createRoutine |
| GET | `/api/routines/{id}` | Detalle de rutina (staff, incluye borradores inactivos) |
| POST | `/api/routines/assign-template` | assignTemplate |
| POST | `/api/routines/generate` | Generar plan de rutina automático (no guarda; el instructor confirma en el builder) |
| GET | `/api/routines/generate/context` | Contexto del miembro para generar rutina (datos ya conocidos) |
| GET | `/api/routines/me` | myRoutines |
| GET | `/api/routines/member/{memberId}` | Rutinas de un miembro (staff) |
| GET | `/api/sales` | Ventas registradas |
| GET | `/api/staff-availability/me` | Listar disponibilidad del gimnasio para citas |
| POST | `/api/staff-availability/me` | Crear bloque de disponibilidad del gimnasio |
| PUT | `/api/staff-availability/me/{id}` | Actualizar bloque de disponibilidad del gimnasio |
| DELETE | `/api/staff-availability/me/{id}` | Eliminar bloque de disponibilidad del gimnasio |
| POST | `/api/staff-availability/me/{id}/block-slot` | Marcar un espacio de disponibilidad como no disponible |
| POST | `/api/staff-availability/me/{id}/cancel-appointments` | Cancelar todas las citas abiertas de un bloque de disponibilidad |
| PUT | `/api/staff-availability/me/{id}/range` | Actualizar rango contiguo de disponibilidad (mismo horario en días consecutivos) |
| DELETE | `/api/staff-availability/me/{id}/range` | Eliminar rango contiguo de disponibilidad |
| POST | `/api/staff-availability/me/{id}/range/cancel-appointments` | Cancelar citas abiertas en todo el rango contiguo de disponibilidad |
| POST | `/api/staff-availability/me/{id}/unblock-slot` | Reactivar un espacio marcado como no disponible |
| POST | `/api/staff-availability/me/range` | Crear disponibilidad del gimnasio en rango de fechas (fecha final opcional) |
| GET | `/api/staff-availability/slots` | Horarios disponibles del gimnasio para solicitar citas |
| GET | `/api/stats/summary` | Estadísticas del gimnasio |
| GET | `/api/users` | getUsers |
| POST | `/api/users` | Crear usuario del gimnasio |
| PUT | `/api/users/{id}` | Actualizar usuario del gimnasio |
| POST | `/api/users/{id}/resend-registration-form` | Reenviar formulario de registro por WhatsApp |
| POST | `/api/users/{id}/send-whatsapp-messages` | Enviar mensajes de WhatsApp al miembro |
| POST | `/api/users/{userId}/membership` | assignMembership |
| GET | `/api/users/me` | getMyProfile |
| GET | `/api/users/me/membership-usage` | myMembershipUsage |
| PUT | `/api/users/me/profile` | updateMyProfile |
| GET | `/api/users/pending-membership-payment` | Miembros con membresía pendiente de pago |
| POST | `/api/users/send-whatsapp-messages-bulk` | Enviar mensajes de WhatsApp a todos con número |
| POST | `/api/users/send-whatsapp-messages-phone` | Enviar mensajes de WhatsApp a un número libre |
| POST | `/api/whatsapp/cloud/send-document` | Cloud API: enviar documento |
| POST | `/api/whatsapp/cloud/send-text` | Cloud API: enviar texto |

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/me` | me |
| POST | `/api/auth/register/{organizationId}` | register |

### Público

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/public/forms/{organizationSlug}/{formSlug}` | Obtener formulario público o metadatos si requiere autenticación |
| POST | `/api/public/forms/{organizationSlug}/{formSlug}/submit` | Enviar respuestas de formulario público |
| GET | `/api/public/organizations` | listActiveOrganizations |

### Mercadeo

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/marketing/media` | Subir imagen de mercadeo (JPG/PNG/WEBP/GIF, máx. 4 MB) |
| PUT | `/api/marketing/products/{id}/offer` | Configurar oferta / descuento de un producto |
| DELETE | `/api/marketing/products/{id}/offer` | Quitar oferta de un producto |
| PUT | `/api/marketing/season` | Actualizar decoración del mes del gimnasio |
| GET | `/api/marketing/season-themes` | Temas estacionales disponibles |

### Plataforma (deshabilitado)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/platform/organizations` | findAll |
| POST | `/api/platform/organizations` | Crear cliente (gimnasio) |
| GET | `/api/platform/organizations/{id}` | findById |
| PUT | `/api/platform/organizations/{id}` | update |

### Tienda y caja

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/cash/denominations` | Listar denominaciones de caja (configuración) |
| PUT | `/api/cash/denominations` | Reemplazar configuración de denominaciones |
| GET | `/api/cash/denominations/active` | Listar denominaciones activas para conteo |
| GET | `/api/cash/opening-float` | Fondo de caja e I.V.A. de referencia del sistema |
| POST | `/api/cash/session/{id}/close` | Cerrar caja (registra fecha y hora de cierre) |
| GET | `/api/cash/session/current` | Obtener caja abierta actual |
| POST | `/api/cash/session/open` | Abrir caja (registra fecha y hora de apertura) |
| GET | `/api/cash/sessions` | Listar aperturas de caja de un día (fecha y hora de cada turno) |
| GET | `/api/cash/settings` | Configuración completa de caja (fondo + denominaciones) |
| PUT | `/api/cash/settings` | Actualizar fondo de caja y denominaciones |
| POST | `/api/store/checkout` | Cobrar venta en punto de venta |
| POST | `/api/store/manual-entry` | Registrar ingreso o gasto manual |
| GET | `/api/store/sales` | Historial de ventas por día, mes o año |
| DELETE | `/api/store/sales/{id}` | Eliminar (anular) un movimiento mientras la caja esté abierta |
| GET | `/api/store/sales/{id}/payment-proof` | Obtener imagen del comprobante de pago |
| PUT | `/api/store/sales/{id}/payment-proof` | Adjuntar comprobante SINPE a una venta |
| GET | `/api/store/sales/day-report` | Reporte del día: cada caja por separado y total del día (suma de todas) |
| GET | `/api/store/sales/summary` | Resumen de ventas del periodo |

### Estadísticas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/statistics/access` | Estado de la contraseña de áreas privadas (solo admin) |
| PUT | `/api/statistics/access` | Definir contraseña de áreas privadas por primera vez (solo admin) |
| PUT | `/api/statistics/access/change` | Cambiar contraseña de áreas privadas (solo admin) |
| GET | `/api/statistics/dashboard` | Dashboard financiero (requiere X-Stats-Unlock) |
| POST | `/api/statistics/unlock` | Desbloquear área privada (p. ej. dashboard de estadísticas) |

<!-- AUTO-GENERATED:END -->
