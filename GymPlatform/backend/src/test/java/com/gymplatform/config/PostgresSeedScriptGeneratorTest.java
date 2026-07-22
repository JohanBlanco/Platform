package com.gymplatform.config;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.util.StreamUtils;

/**
 * Genera scripts PostgreSQL estáticos desde los seeds H2.
 * Ejecutar tras cambiar db/demo-seed*.sql: mvn test -Dtest=PostgresSeedScriptGeneratorTest
 */
class PostgresSeedScriptGeneratorTest {

    private static final String[] SCRIPTS = {
        "db/demo-seed.sql",
        "db/demo-seed-sales.sql",
        "db/demo-seed-member.sql",
        "db/demo-seed-member-staff.sql"
    };

    @Test
    void generatePostgresSeedScripts() throws Exception {
        Path outDir = Paths.get("src/main/resources/db/postgres");
        Files.createDirectories(outDir);
        StringBuilder all = new StringBuilder();
        all.append("-- GymPlatform demo completo para PostgreSQL (generado desde seeds H2)\n");
        all.append("-- Regenerar: mvn test -Dtest=PostgresSeedScriptGeneratorTest\n");
        all.append("-- Cargar: bash scripts/load-postgres-demo.sh\n\n");

        for (String script : SCRIPTS) {
            String h2 = StreamUtils.copyToString(new ClassPathResource(script).getInputStream(), StandardCharsets.UTF_8);
            String pg = DemoSeedSqlDialect.toPostgres(h2);
            String upper = pg.toUpperCase();
            for (String token : DemoSeedSqlDialect.H2_REMNANTS) {
                if (upper.contains(token.toUpperCase())) {
                    throw new IllegalStateException(script + " still contains " + token + " after translation");
                }
            }
            String fileName = script.substring(script.lastIndexOf('/') + 1);
            Path target = outDir.resolve(fileName);
            Files.writeString(target, pg, StandardCharsets.UTF_8);

            all.append("-- ========== ").append(fileName).append(" ==========\n");
            all.append(pg.trim()).append("\n\n");
        }

        Files.writeString(outDir.resolve("demo-seed-all.sql"), all.toString(), StandardCharsets.UTF_8);
    }
}
