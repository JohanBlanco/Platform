# GymPlatform Wiki

Bienvenido a la documentación de **GymPlatform**, panel de administración para un gimnasio.

## Índice

| Página | Descripción |
|--------|-------------|
| [Inicio rápido](Getting-Started) | Requisitos y cómo levantar el proyecto |
| [Guía de pruebas](Testing-Guide) | **Cómo ejecutar tests** + checklists por rol |
| [Publicar Wiki](SETUP-WIKI) | Subir `docs/wiki/` a GitHub Wiki |
| [Tech Stack](Tech-Stack) | Tecnologías API, DB, web + diagramas |
| [Arquitectura](Architecture) | Capas, roles y modelo |
| [Modelo de datos (ERD)](Database-ERD) | Diagrama entidad-relación por dominios |
| [Migrar a PostgreSQL](Migrate-H2-to-PostgreSQL) | De H2 file a Postgres |
| [Frontend](Frontend) | React, rutas, auth, patrones UI |
| [Referencia API](API-Reference) | Endpoints y Swagger |
| [Roles y permisos](Roles-and-Permissions) | Qué puede hacer cada rol |
| [Changelog](Changelog) | Bitácora de cambios por sesión |

## Enlaces rápidos

- **Wiki en GitHub**: https://github.com/JohanBlanco/Platform/wiki
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **Web**: http://localhost:5173
- **API**: http://localhost:8080/api

## Tests (resumen)

```bash
cd backend && mvn test          # unit + integración
cd e2e && mvn test              # Selenium (backend + web arriba)
```

Detalle: [Guía de pruebas](Testing-Guide)

## Cuentas de prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@gymplatform.local | 12345678 |
| Instructor | instructor@gymplatform.local | instructor123 |
| Recepcionista | recepcion@gymplatform.local | recepcion123 |
| Miembro | miembro@gymplatform.local | miembro123 |

El administrador demo puede cambiar de perfil (Administrador / Recepcionista / Instructor / Miembro) para probar el switch.

## Contraseña por defecto

| Acción | Contraseña inicial |
|--------|-------------------|
| Crear usuario staff (`POST /api/users` sin `password`) | `12345678` |
| Áreas privadas / estadísticas | `12345678` |

## Otras fuentes de documentación

- **Swagger** — documentación interactiva de la API
- **Notion** — hub de proyecto (uso, roadmap, notas)
- **Cursor Rules** — convenciones en `.cursor/rules/`
- **README** — inicio rápido en el repositorio

---

*Última actualización: 2026-07-23 (auto-sync)*
