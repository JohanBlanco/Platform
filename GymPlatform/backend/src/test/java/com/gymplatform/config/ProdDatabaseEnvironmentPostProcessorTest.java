package com.gymplatform.config;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.core.env.MapPropertySource;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProdDatabaseEnvironmentPostProcessorTest {

    private final ProdDatabaseEnvironmentPostProcessor processor = new ProdDatabaseEnvironmentPostProcessor();

    @Test
    void parsesNeonDatabaseUrl() {
        var parsed = ProdDatabaseEnvironmentPostProcessor.parsePostgresUrl(
                "postgresql://neondb_owner:secret@ep-test.us-east-1.aws.neon.tech/neondb?sslmode=require");

        assertEquals("neondb_owner", parsed.username());
        assertEquals("secret", parsed.password());
        assertTrue(parsed.jdbcUrl().startsWith("jdbc:postgresql://ep-test.us-east-1.aws.neon.tech/neondb"));
        assertTrue(parsed.jdbcUrl().contains("sslmode=require"));
    }

    @Test
    void mapsDatabaseUrlWhenProdProfileOnlyInSpringProfilesActive() {
        MockEnvironment environment = isolatedEnv(Map.of(
                "SPRING_PROFILES_ACTIVE", "prod",
                "DB_URL", "",
                "DATABASE_URL",
                "postgresql://neondb_owner:secret@ep-test.us-east-1.aws.neon.tech/neondb?sslmode=require"));

        processor.postProcessEnvironment(environment, new SpringApplication());

        assertEquals(
                "jdbc:postgresql://ep-test.us-east-1.aws.neon.tech/neondb?sslmode=require",
                environment.getProperty("spring.datasource.url"));
        assertEquals("neondb_owner", environment.getProperty("spring.datasource.username"));
        assertEquals("secret", environment.getProperty("spring.datasource.password"));
        assertEquals("org.postgresql.Driver", environment.getProperty("spring.datasource.driver-class-name"));
    }

    @Test
    void mapsDbUrlWhenProdProfileOnlyInSpringProfilesActive() {
        MockEnvironment environment = isolatedEnv(Map.of(
                "SPRING_PROFILES_ACTIVE", "prod",
                "DB_URL", "jdbc:postgresql://ep-test.us-east-1.aws.neon.tech/neondb?sslmode=require",
                "DB_USER", "neondb_owner",
                "DB_PASSWORD", "secret"));

        processor.postProcessEnvironment(environment, new SpringApplication());

        assertEquals(
                "jdbc:postgresql://ep-test.us-east-1.aws.neon.tech/neondb?sslmode=require",
                environment.getProperty("spring.datasource.url"));
        assertEquals("neondb_owner", environment.getProperty("spring.datasource.username"));
        assertEquals("secret", environment.getProperty("spring.datasource.password"));
    }

    /** Evita que DB_URL del .env local del desarrollador contamine el test. */
    private static MockEnvironment isolatedEnv(Map<String, Object> properties) {
        MockEnvironment environment = new MockEnvironment();
        environment.getPropertySources().addFirst(new MapPropertySource("test-isolated", properties));
        return environment;
    }
}
