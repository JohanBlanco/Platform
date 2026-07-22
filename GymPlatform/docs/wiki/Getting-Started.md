# Inicio rápido

## Requisitos

| Componente | Versión |
|------------|---------|
| Java | 17+ |
| Maven | 3.8+ |
| Node.js | 18+ |

## 1. Backend (obligatorio)

```bash
cd backend
mvn spring-boot:run
```

- API: http://localhost:8080
- Swagger: http://localhost:8080/swagger-ui.html
- H2 Console (perfil `dev`): http://localhost:8080/h2-console

Al arrancar se cargan datos demo automáticamente (ver cuentas en [Home](Home)).

Con PostgreSQL local: ver [Migrar a PostgreSQL](Migrate-H2-to-PostgreSQL).

## 2. Web

```bash
cd web
npm install
npm run dev
```

Abre http://localhost:5173

## Orden recomendado

1. Levantar **backend** primero
2. Luego **web**
3. Probar login con cuentas demo
4. Consultar [Guía de pruebas](Testing-Guide) para flujos por rol

## Verificar que todo funciona

```bash
# Backend compila
cd backend && mvn compile

# Web construye
cd web && npm run build
```

## Problemas comunes

| Problema | Solución |
|----------|----------|
| CORS error en web | Verificar backend corriendo y `app.cors.allowed-origins` en `application.properties` |
| 401 en API | Hacer login y usar token JWT en header `Authorization: Bearer <token>` |
| Datos vacíos | Reiniciar backend; con H2 file los datos persisten en `backend/data/` |
