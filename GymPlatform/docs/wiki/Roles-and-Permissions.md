# Roles y permisos

## Matriz de capacidades

| Capacidad | Administrador (`GYM_OWNER`) | Recepcionista | Instructor | Miembro |
|-----------|:---------------------------:|:-------------:|:----------:|:-------:|
| Usuarios / membresías | ✅ | ✅* | ❌* | ❌ |
| Actividades / calendario | ✅ | ✅ | ✅* | reservar |
| Ventas / POS | ✅ | ✅ | ✅* | ❌ |
| Estadísticas (área privada) | ✅ | ❌ | ❌ | ❌ |
| Mercadeo | ✅ | ✅ | ❌ | ❌ |
| Plantillas / rutinas | ✅ | ❌ | ✅ | ver propias |
| Solicitudes de rutina | ✅ | ❌ | atender | solicitar |
| Citas | ✅ | ✅ | ✅ | agendar propias |
| Perfil propio | ✅ | ✅ | ✅ | ✅ |

\* La UI filtra por rol activo; la API aún puede necesitar endurecer `@PreAuthorize` en algunos endpoints.

## Administrador (`GYM_OWNER`)

- Etiqueta en UI: **Administrador** (no “dueño”)
- Login demo: `admin@fitlife.com` / `12345678`
- Puede cambiar de perfil (Recepcionista, Instructor, Miembro) si tiene esos roles
- Contraseña por defecto al crear staff sin password: **`12345678`**

## Recepcionista (`RECEPTIONIST`)

- Usuarios, productos, actividades, ventas, mercadeo (según menú)

## Instructor (`INSTRUCTOR`)

- Crea plantillas y rutinas; atiende solicitudes

## Miembro (`MEMBER`)

- Auto-registro vía `POST /api/auth/register/{orgId}`
- Reservar actividades, citas, ver rutinas / nutrición / medidas

## Plataforma (retirado)

La gestión multi-gimnasio (`PLATFORM_OWNER`, `/api/platform/**`) **ya no forma parte del producto**.

## Estados de reservación

| Estado | Transiciones |
|--------|-------------|
| PENDING | → CONFIRMED, CANCELLED |
| CONFIRMED | → CANCELLED |
| CANCELLED | (final) |

## Estados de solicitud de rutina

| Estado | Descripción |
|--------|-------------|
| PENDING | Recién creada por miembro |
| IN_PROGRESS | Instructor la tomó |
| COMPLETED | Rutina entregada |
| REJECTED | Rechazada |
