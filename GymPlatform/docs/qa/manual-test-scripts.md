# Scripts de prueba manual (QA)

Cada caso tiene un ID trazable. Los marcados **AUTO** tienen equivalente Selenium en `e2e/src/test/java/com/gymplatform/e2e/qa/`.

## Pre-requisitos

1. `docker compose up -d` (opcional, solo PG)
2. Backend: `cd backend && mvn spring-boot:run`
3. Web: `cd web && npm run dev`
4. Cuentas demo en `.cursor/rules/gym-platform-overview.mdc`

---

## 1. Autenticación

| ID | Pasos manuales | Resultado esperado | AUTO |
|----|----------------|-------------------|------|
| TC-LOGIN-001 | Abrir `/login` → `admin@fitlife.com` / `12345678` → Iniciar sesión | Dashboard con sidebar; enlace **Administración** visible | ✅ `LoginFlowSeleniumTest#adminCanLogin` |
| TC-LOGIN-002 | Credenciales incorrectas | Permanece en `/login`; toast de error | ✅ `LoginFlowSeleniumTest#invalidCredentialsStayOnLogin` |
| TC-LOGIN-003 | `gymplatformadmin` / `gymplatformadmin` | Entra al panel (cuenta oculta en listados) | ✅ `LoginFlowSeleniumTest#bootstrapAdminCanLogin` |
| TC-LOGIN-004 | Campo vacío → submit | Toast “Ingresa correo o cédula y contraseña” | — |
| TC-LOGIN-005 | Login por cédula demo miembro | `miembro@fitlife.com` con cédula del seed | — |
| TC-LOGOUT-001 | Menú usuario → Cerrar sesión | Redirige a `/login` | ✅ `RoleNavigationSeleniumTest#logoutReturnsToLogin` |

---

## 2. Roles y navegación

| ID | Pasos | Resultado | AUTO |
|----|-------|-----------|------|
| TC-ROLE-001 | Admin → menú → perfil **Miembro** | Sidebar muestra rutinas/reservaciones | ✅ `RoleNavigationSeleniumTest#adminSwitchesToMemberProfile` |
| TC-MEMBER-001 | `miembro@fitlife.com` / `miembro123` | Nav de miembro (servicios/reservaciones) | ✅ `RoleNavigationSeleniumTest#memberSeesMemberNav` |
| TC-RECEP-001 | `recepcion@fitlife.com` / `recepcion123` | Sin enlace **Estadísticas** | ✅ `RoleNavigationSeleniumTest#receptionistCannotSeeStatisticsNav` |
| TC-INST-001 | `instructor@fitlife.com` / `instructor123` | Sección entrenamiento / plantillas | — |

---

## 3. API (integración backend — MockMvc)

| ID | Endpoint | AUTO |
|----|----------|------|
| TC-API-001 | `POST /api/auth/login` bootstrap | ✅ `AuthIntegrationTest` |
| TC-API-002 | `GET /api/users` sin bootstrap en lista | ✅ `AuthIntegrationTest#bootstrapUserHiddenFromUserList` |
| TC-API-003 | Arranque con seeds FitLife | ✅ `ApplicationStartupIntegrationTest` |

---

## 4. PostgreSQL (Testcontainers)

| ID | Comando | AUTO |
|----|---------|------|
| TC-PG-001 | `mvn -Ppostgres-it test -Dtest=PostgresIntegrationTest` | ✅ seeds + bootstrap en PG real |

---

## Ejecutar automatización

```bash
# Unit + integración (H2, sin Docker PG)
cd backend && mvn test

# Integración PostgreSQL (requiere Docker)
cd backend && mvn test -Dtest=PostgresIntegrationTest

# E2E Selenium (requiere backend + web corriendo)
cd e2e && mvn test
# o: bash e2e/scripts/run-e2e.sh
```
