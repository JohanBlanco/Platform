package com.gymplatform.config;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.util.StreamUtils;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;

class DemoSeedSqlDialectTest {

    @Test
    void translatesAllDemoSeedScriptsForPostgres() throws Exception {
        for (String script : new String[] {
            "db/demo-seed.sql",
            "db/demo-seed-sales.sql",
            "db/demo-seed-member.sql",
            "db/demo-seed-member-staff.sql"
        }) {
            String h2 = StreamUtils.copyToString(new ClassPathResource(script).getInputStream(), StandardCharsets.UTF_8);
            String pg = assertDoesNotThrow(() -> DemoSeedSqlDialect.toPostgres(h2), script);
            String upper = pg.toUpperCase();
            for (String token : DemoSeedSqlDialect.H2_REMNANTS) {
                assertFalse(upper.contains(token.toUpperCase()), script + " still contains " + token);
            }
        }
    }
}
