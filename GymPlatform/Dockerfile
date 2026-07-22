# GymPlatform API — Docker image for Render (runtime: Docker, rootDir: GymPlatform)
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /build

COPY backend/pom.xml .
COPY backend/src ./src

RUN apt-get update \
    && apt-get install -y --no-install-recommends maven \
    && rm -rf /var/lib/apt/lists/* \
    && mvn -B -DskipTests -Pdocker package

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

RUN mkdir -p /tmp/gymplatform-uploads /tmp/gymplatform-data

COPY --from=build /build/target/gym-platform-api-1.0.0.jar app.jar

ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

EXPOSE 8080

# Render sets PORT; Spring reads server.port=${PORT:8080} in application-prod.properties
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
