# Cypress E2E — GymPlatform Web

Simula testers reales en el navegador. Casos `TC-*` en `docs/qa/manual-test-scripts.md`.

## Credenciales (siempre)

| Campo | Valor |
|-------|--------|
| Usuario | `gymplatformadmin` |
| Contraseña | `gymplatformadmin` |

Tiene todos los roles. En los tests se cambia perfil con el menú usuario:

- **Administrador** — config, usuarios, estadísticas
- **Recepcionista** — actividades, recepción, POS
- **Instructor** — rutinas, plantillas
- **Miembro** — reservaciones, rutinas propias

Comandos Cypress:

```typescript
cy.loginAsPlatformAdmin()
cy.loginAsProfile('Recepcionista')
cy.switchToProfile('Miembro')
```

## Cómo ejecutar

### 1. Ver tests en el navegador (recomendado)

**Local** (`localhost:5173` — backend `:8080` + `npm run dev`):

```bash
cd web
npm run cy:open
```

**Vercel prod** ([gym-platform-cr.vercel.app](https://gym-platform-cr.vercel.app)):

```bash
cd web
npm run cy:open:prod
```

En la app Cypress: **E2E Testing** → Chrome → elige un spec → ▶ Run.

### 2. Terminal (headless)

```bash
cd web
npm run cy:run          # local
npm run cy:run:prod     # Vercel
```

## Requisitos

| Entorno | Necesitas |
|---------|-----------|
| **Local** | `mvn spring-boot:run` + `npm run dev` |
| **Prod** | Vercel + Render despierto (1.ª petición puede tardar ~1 min en free tier) |

## Specs

| Archivo | Qué prueba |
|---------|------------|
| `login.cy.ts` | Login, errores, campos vacíos |
| `role-navigation.cy.ts` | Cambio de perfil, logout |
| `activities-crud.cy.ts` | CRUD actividades (solo local; modifica BD) |
| `smoke-prod.cy.ts` | Smoke en prod |

## Perfiles en tests

| Acción | Comando |
|--------|---------|
| Solo login admin | `cy.loginAsPlatformAdmin()` |
| Ir directo a un perfil | `cy.loginAsProfile('Recepcionista')` |
| Cambiar después de login | `cy.switchToProfile('Miembro')` |
