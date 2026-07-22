package com.gymplatform.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DatabaseProfilesTest {

    @Test
    void recognizesH2Profiles() {
        MockEnvironment dev = new MockEnvironment().withProperty("spring.profiles.active", "dev");
        MockEnvironment test = new MockEnvironment().withProperty("spring.profiles.active", "test");

        assertTrue(DatabaseProfiles.isH2(dev));
        assertTrue(DatabaseProfiles.isH2(test));
        assertTrue(DatabaseProfiles.isKnownProfile(dev));
        assertTrue(DatabaseProfiles.isKnownProfile(test));
        assertFalse(DatabaseProfiles.isPostgres(dev));
    }

    @Test
    void recognizesPostgresProfiles() {
        for (String profile : new String[] {"dev-postgresql", "dev-postgress", "prod", "postgres"}) {
            MockEnvironment env = new MockEnvironment().withProperty("spring.profiles.active", profile);
            assertTrue(DatabaseProfiles.isPostgres(env), profile);
            assertTrue(DatabaseProfiles.isKnownProfile(env), profile);
            assertFalse(DatabaseProfiles.isH2(env), profile);
        }
    }

    @Test
    void mapsDemoSeedPathByEngine() {
        MockEnvironment h2 = new MockEnvironment().withProperty("spring.profiles.active", "test");
        MockEnvironment pg = new MockEnvironment().withProperty("spring.profiles.active", "dev-postgresql");

        assertTrue(DatabaseProfiles.demoSeedPath("db/demo-seed.sql", h2).endsWith("demo-seed.sql"));
        assertTrue(DatabaseProfiles.demoSeedPath("db/demo-seed.sql", pg).contains("postgres"));
    }
}
