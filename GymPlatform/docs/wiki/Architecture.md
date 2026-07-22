# Arquitectura

## Visión general

GymPlatform es el **panel de un gimnasio**: usuarios, membresías, actividades, citas, entrenamiento, ventas y mercadeo.

> Ya no incluye un “dueño de plataforma” que administra varios gimnasios como clientes. La API `/api/platform/**` está deshabilitada.

```
┌─────────────────────────────────────┐
│         Gimnasio (Organization)     │
│   GymPlatform (demo)                │
└────────────────┬────────────────────┘
                 │
    Usuarios (Administrador, Recepción, Instructor, Miembro)
    Paquetes, actividades, rutinas, ventas, formularios…
```

## Capas técnicas

| Capa | Tecnología | Puerto |
|------|------------|--------|
| API | Spring Boot 3.4 + Java 17 + JPA + JWT | 8080 |
| Web | React 19 + TypeScript + Vite 6 | 5173 |
| DB dev | H2 **file** (`./data/gymdb`) | consola `/h2-console` |
| DB prod | PostgreSQL (driver listo; ver migración) | 5432 |

Documentación ampliada:

- **[Tech Stack](Tech-Stack)** — tecnologías, diagramas, mejoras
- **[Database ERD](Database-ERD)** — modelo de datos por dominio
- **[Migrar H2 → PostgreSQL](Migrate-H2-to-PostgreSQL)**
- **[Frontend](Frontend)** — estructura y patrones del panel web

## Roles (UI)

| Código | Etiqueta |
|--------|----------|
| `GYM_OWNER` | Administrador |
| `RECEPTIONIST` | Recepcionista |
| `INSTRUCTOR` | Instructor |
| `MEMBER` | Miembro |

## Autenticación

- Login → JWT con claims: `userId`, roles, `organizationId`
- Scope de datos por `organizationId` del token

## Flujo request

```
Browser / App
     │
     ▼
  JWT en header
     │
     ▼
 Spring Security → Controller → Service → Repository → DB
```

## Documentación relacionada

- [Roles y permisos](Roles-and-Permissions)
- [Referencia API](API-Reference) + Swagger UI
- [Guía de pruebas](Testing-Guide)
