package com.gymplatform.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProdDatabaseEnvironmentPostProcessorTest {

    @Test
    void parsesNeonDatabaseUrl() {
        var parsed = ProdDatabaseEnvironmentPostProcessor.parsePostgresUrl(
                "postgresql://neondb_owner:secret@ep-test.us-east-1.aws.neon.tech/neondb?sslmode=require");

        assertEquals("neondb_owner", parsed.username());
        assertEquals("secret", parsed.password());
        assertTrue(parsed.jdbcUrl().startsWith("jdbc:postgresql://ep-test.us-east-1.aws.neon.tech/neondb"));
        assertTrue(parsed.jdbcUrl().contains("sslmode=require"));
    }
}
