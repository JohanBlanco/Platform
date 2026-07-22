# Render — Web Service (Docker)
#
# Runtime:        Docker
# Root Directory: GymPlatform
# Dockerfile:     Dockerfile (default)
# Build / Start:  (vacío — los define el Dockerfile)
#
# Environment (copiar desde .env local, NO commitear secrets):
#   SPRING_PROFILES_ACTIVE=prod
#   DB_URL=jdbc:postgresql://HOST/neondb?sslmode=require
#   DB_USER=
#   DB_PASSWORD=
#   SPRING_JPA_HIBERNATE_DDL_AUTO=validate
#   APP_JWT_SECRET=
#   APP_SECRETS_ENCRYPTION_KEY=
#   APP_CORS_ALLOWED_ORIGINS=http://localhost:5173
#   APP_PUBLIC_BASE_URL=http://localhost:5173
#
# Render inyecta PORT automáticamente; application-prod.properties usa server.port=${PORT:8080}
#
# Verificar: https://TU-SERVICIO.onrender.com/swagger-ui.html
