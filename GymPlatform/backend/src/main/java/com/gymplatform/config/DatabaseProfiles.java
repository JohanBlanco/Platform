package com.gymplatform.config;

import java.util.Arrays;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;

/** Perfiles Spring Boot de base de datos. */
public final class DatabaseProfiles {

    public static final String DEV = "dev";
    /** H2 en memoria para {@code mvn test} (ver {@code application-test.properties}). */
    public static final String TEST = "test";
    public static final String DEV_POSTGRESQL = "dev-postgresql";
    /** Alias tolerado del typo frecuente {@code dev-postgress}. */
    public static final String DEV_POSTGRESQL_TYPO = "dev-postgress";
    public static final String PROD = "prod";

    /** Perfil legacy; tratar como {@link #DEV_POSTGRESQL}. */
    public static final String LEGACY_POSTGRES = "postgres";

    private DatabaseProfiles() {}

    public static boolean isPostgres(Environment environment) {
        return environment.acceptsProfiles(Profiles.of(
                DEV_POSTGRESQL, DEV_POSTGRESQL_TYPO, PROD, LEGACY_POSTGRES));
    }

    public static boolean isH2(Environment environment) {
        return environment.acceptsProfiles(Profiles.of(DEV, TEST));
    }

    public static boolean isKnownProfile(Environment environment) {
        return isPostgres(environment) || isH2(environment);
    }

    public static String describe(Environment environment) {
        String[] active = environment.getActiveProfiles();
        if (active.length == 0) {
            return DEV + " (default)";
        }
        return String.join(", ", active);
    }

    /** Ruta classpath de seeds demo según motor activo. */
    public static String demoSeedPath(String h2Classpath, Environment environment) {
        if (isPostgres(environment)) {
            return DemoSeedSqlDialect.postgresScriptPath(h2Classpath);
        }
        return h2Classpath;
    }

    public static boolean usesLegacyPostgresProfile(Environment environment) {
        return Arrays.asList(environment.getActiveProfiles()).contains(LEGACY_POSTGRES);
    }
}
