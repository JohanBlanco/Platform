# Cypress E2E — GymPlatform Web

Simula testers reales en el navegador. Casos `TC-*` en `docs/qa/manual-test-scripts.md`.

## Dos modos

| Modo | Backend | Login |
|------|---------|--------|
| **Local E2E (BD vacía)** | `dev,e2e` — seed mínimo | Cuentas por rol (`recepcion@…`, `miembro@…`, etc.) |
| **Demo / prod** | Demo completo o Vercel | `gymplatformadmin` + cambio de perfil |

## Local E2E — BD vacía (recomendado para QA)

### 1. Reset + backend

```bash
# Detén el backend si está corriendo, luego:
bash scripts/e2e-reset-db.sh
cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=dev,e2e
```

El reset también borra `web/cypress/.local-e2e-state.json` (estado compartido entre specs 01–03).

### 2. Frontend + Cypress

```bash
cd web && npm run dev          # terminal 2
cd web && npm run cy:open:local # o cy:run:local
```

### Cuentas (seed `e2e-minimal.sql`)

| Rol | Usuario | Contraseña |
|-----|---------|------------|
| Recepcionista | `recepcion@gymplatform.local` | `recepcion123` |
| Instructor | `instructor@gymplatform.local` | `instructor123` |
| Miembro | `miembro@gymplatform.local` | `miembro123` |
| Administrador | `admin@gymplatform.local` | `12345678` |

Comandos:

```typescript
cy.loginAsReception()
cy.loginAsInstructor()
cy.loginAsMember()
cy.loginAsAdmin()
```

### Specs locales (ordenados)

| Archivo | Flujo |
|---------|--------|
| `local/00-auth-roles.cy.ts` | Smoke login por rol |
| `local/01-reception-catalog.cy.ts` | Productos, membresía, actividades |
| `local/02-reception-cash-registers.cy.ts` | 3 cajas: efectivo, SINPE, mixto; agotado |
| `local/03-activities-lifecycle.cy.ts` | Reserva → cancelación instructor |
| `local/04-appointments.cy.ts` | Disponibilidad, cita, cancelación |
| `local/05-nutrition-measurements.cy.ts` | Plan nutricional + medidas corporales |

```bash
npm run cy:run:local   # headless, suite completa
```

## Demo local / prod

| Campo | Valor |
|-------|--------|
| Usuario | `gymplatformadmin` |
| Contraseña | `gymplatformadmin` |

```typescript
cy.loginAsPlatformAdmin()
cy.loginAsProfile('Recepcionista')
cy.switchToProfile('Miembro')
```

```bash
npm run cy:open        # local demo
npm run cy:open:prod   # Vercel
npm run cy:run:prod    # smoke prod
```

## Requisitos

| Entorno | Necesitas |
|---------|-----------|
| **Local E2E** | Backend `dev,e2e` + `npm run dev`. **Cierra y reabre Cypress** tras cambios en `cypress.config.ts` (flags del navegador). |
| **Local demo** | `mvn spring-boot:run` (perfil dev normal) |
| **Prod** | Vercel + Render despierto |
