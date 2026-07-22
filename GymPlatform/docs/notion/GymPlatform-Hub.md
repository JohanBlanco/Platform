# GymPlatform — Hub de Proyecto

> Importar a Notion: copiar secciones como páginas hijas o usar Notion MCP cuando esté autenticado.

**Última actualización:** 2026-07-20  
**Estado:** MVP — un gimnasio (sin multi-cliente PLATFORM_OWNER)

---

## Resumen

Panel para un gimnasio: API (Spring Boot 3 / Java 17) y Web (React 19 + Vite). DB: H2 file; PostgreSQL preparado.

Docs: `docs/wiki/Tech-Stack.md`, `Database-ERD.md`, `Frontend.md`, `Migrate-H2-to-PostgreSQL.md`.

---

## Enlaces rápidos

| Recurso | URL / Ubicación |
|---------|-----------------|
| Swagger UI | http://localhost:8080/swagger-ui.html |
| Web local | http://localhost:5173 |
| Tech Stack | `docs/wiki/Tech-Stack.md` |
| ERD | `docs/wiki/Database-ERD.md` |
| Frontend | `docs/wiki/Frontend.md` |
| Migración PG | `docs/wiki/Migrate-H2-to-PostgreSQL.md` |
| GitHub Wiki | `docs/wiki/` |
| Cursor Rules | `.cursor/rules/` |

---

## Cuentas demo

| Rol | Email | Contraseña | Notas |
|-----|-------|------------|-------|
| Administrador | admin@fitlife.com | 12345678 | Perfiles: Admin, Recepcionista, Instructor, Miembro |
| Instructor | instructor@fitlife.com | instructor123 | |
| Recepcionista | recepcion@fitlife.com | recepcion123 | |
| Miembro | miembro@fitlife.com | miembro123 | |

- **Staff nuevo** sin password: `12345678`
- **Áreas privadas / estadísticas:** `12345678`


---

## Cómo levantar el proyecto

### Backend
```bash
cd backend && mvn spring-boot:run
```

### Web
```bash
cd web && npm install && npm run dev
```

---

## Cuentas de prueba

Ver tabla de cuentas demo arriba.

### Contraseña por defecto

- **Nuevo usuario staff:** si no se envía `password` en la API, se usa `12345678`

---

## Estado actual del MVP

### Implementado
- [x] Organización del gimnasio + usuarios por roles
- [x] Auth JWT
- [x] Membresías, actividades, reservas, citas
- [x] Rutinas, nutrición, medidas
- [x] Ventas / caja / estadísticas
- [x] Panel web
- [x] Swagger + Wiki

### Pendiente
- [ ] RBAC fino por rol
- [ ] Pagos
- [ ] Tests automatizados
- [ ] PostgreSQL + migraciones

---

## Guía de pruebas por rol

### Administrador
1. Login `admin@fitlife.com` → panel del gym
2. Administración / ventas / estadísticas
3. Switch a perfil Miembro

### Instructor
1. Login → solicitudes de rutina
2. Tomar solicitud / crear plantillas

### Miembro
1. Login → reservar actividad
2. Ver rutinas / nutrición / medidas
3. Editar perfil
4. Solicitar rutina

---

## Bitácora de sesiones

### 2026-07-19
- Menú **Mercadeo** (actividades, ofertas de productos, decoración del mes).
- Promociones: subir imagen, URL o sugerencias; carrusel en inicio del miembro.
- Ofertas de productos con etiqueta % OFF en el punto de venta.
- Temas estacionales (Navidad, Halloween, San Valentín, etc.).
- Retención automática: citas y actividades se eliminan un mes después de terminar.

### 2026-07-10
- Proyecto inicial creado
- Documentación en Swagger, Wiki, Notion (plantilla), Cursor Rules
- Backend compila, web construye

---

## Roadmap (ideas)

- [ ] Dashboard con métricas por gimnasio
- [ ] Check-in con QR
- [ ] Horarios recurrentes de clases
- [ ] Chat instructor-miembro
- [ ] App white-label por gimnasio

---

## Notas de arquitectura

- DB dev: H2 in-memory (se reinicia al parar backend)
- JWT expira en 24h
- CORS: localhost:5173, localhost:3000
- Tenant isolation por `organizationId` en JWT

---

## Sincronización de docs

Al trabajar en el app, actualizar:

1. **Swagger** — automático si hay anotaciones en controllers
2. **Wiki** — `docs/wiki/*.md`
3. **Esta página Notion** — estado y bitácora
4. **Changelog** — `docs/wiki/Changelog.md`

Cursor tiene reglas en `.cursor/rules/documentation-sync.mdc` para recordar esto.
