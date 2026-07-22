package com.gymplatform.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
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
        MockEnvironment environment = new MockEnvironment()
                .withProperty("SPRING_PROFILES_ACTIVE", "prod")
                .withProperty("DATABASE_URL",
                        "postgresql://neondb_owner:secret@ep-test.us-east-1.aws.neon.tech/neondb?sslmode=require");

        processor.postProcessEnvironment(environment, new SpringApplication());

        assertEquals(
                "jdbc:postgresql://ep-test.us-east-1.aws.neon.tech/neondb?sslmode=require",
                environment.getProperty("spring.datasource.url"));
        assertEquals("neondb_owner", environment.getProperty("spring.datasource.username"));
        assertEquals("secret", environment.getProperty("spring.datasource.password"));
        assertEquals("org.postgresql.Driver", environment.getProperty("spring.datasource.driver-class-name"));
    }
}
