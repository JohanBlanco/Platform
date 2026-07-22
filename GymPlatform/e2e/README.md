# E2E — Selenium

Pruebas de usuario final contra la web React (`:5173`) con backend API (`:8080`).

## Requisitos

- Java 17+
- Google Chrome (WebDriverManager descarga chromedriver)
- Backend y web en ejecución

## Arranque rápido

Terminal 1 — API:

```bash
cd backend
mvn spring-boot:run
```

Terminal 2 — Web:

```bash
cd web
npm install
npm run dev
```

Terminal 3 — E2E:

```bash
cd e2e
mvn test
```

O script todo-en-uno (solo ejecuta tests; debes tener servicios arriba):

```bash
bash e2e/scripts/run-e2e.sh
```

## Variables

| Variable | Default | Uso |
|----------|---------|-----|
| `GYMPLATFORM_WEB_URL` | `http://localhost:5173` | URL base de la SPA |

Si la web no responde, los tests se **omitien** (`AssumptionViolated`) en lugar de fallar.

## Estructura

- `pages/` — Page Objects (login, shell)
- `qa/` — casos TC-* mapeados desde `docs/qa/manual-test-scripts.md`
- `support/BaseSeleniumTest.java` — WebDriver headless Chrome

## CI

Los E2E no corren en CI por defecto (requieren Chrome + servicios). Backend `mvn test` sí corre en `.github/workflows/tests.yml`.
