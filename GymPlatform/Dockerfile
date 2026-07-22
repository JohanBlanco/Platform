# Build
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /build

COPY backend/pom.xml .
COPY backend/src ./src

RUN apt-get update \
    && apt-get install -y --no-install-recommends maven \
    && rm -rf /var/lib/apt/lists/* \
    && mvn -B -DskipTests package

# Run
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

COPY --from=build /build/target/gym-platform-api-1.0.0.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
