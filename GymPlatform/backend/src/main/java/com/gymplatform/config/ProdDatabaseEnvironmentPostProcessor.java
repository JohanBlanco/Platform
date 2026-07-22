package com.gymplatform.config;

import java.net.URI;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.Profiles;

/**
 * En prod, normaliza credenciales Neon/Render:
 * <ul>
 *   <li>{@code DB_URL} + {@code DB_USER} + {@code DB_PASSWORD} (preferido)</li>
 *   <li>{@code SPRING_DATASOURCE_*} (estándar Spring Boot)</li>
 *   <li>{@code DATABASE_URL=postgresql://...} (Neon / Render)</li>
 * </ul>
 */
public class ProdDatabaseEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final String SOURCE = "gymplatformProdDatabase";
    private static final String POSTGRES_DRIVER = "org.postgresql.Driver";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        if (!isProd(environment)) {
            return;
        }

        Map<String, Object> overrides = new HashMap<>();

        String dbUrl = firstNonBlank(
                property(environment, "DB_URL"),
                property(environment, "SPRING_DATASOURCE_URL"),
                property(environment, "spring.datasource.url"));

        String dbUser = firstNonBlank(
                property(environment, "DB_USER"),
                property(environment, "SPRING_DATASOURCE_USERNAME"),
                property(environment, "spring.datasource.username"));

        String dbPassword = firstNonBlank(
                property(environment, "DB_PASSWORD"),
                property(environment, "SPRING_DATASOURCE_PASSWORD"),
                property(environment, "spring.datasource.password"));

        String databaseUrl = property(environment, "DATABASE_URL");
        if (isBlank(dbUrl) && !isBlank(databaseUrl)) {
            if (databaseUrl.startsWith("jdbc:postgresql:")) {
                dbUrl = databaseUrl.trim();
            } else {
                ParsedPostgres parsed = parsePostgresUrl(databaseUrl.trim());
                dbUrl = parsed.jdbcUrl();
                if (isBlank(dbUser)) {
                    dbUser = parsed.username();
                }
                if (isBlank(dbPassword)) {
                    dbPassword = parsed.password();
                }
            }
        }

        if (isBlank(dbUrl)) {
            throw new IllegalStateException(
                    """
                    Perfil prod sin base de datos configurada.
                    En Render → Environment agrega:
                      DB_URL=jdbc:postgresql://HOST/neondb?sslmode=require
                      DB_USER=...
                      DB_PASSWORD=...
                    (o DATABASE_URL=postgresql://USER:PASS@HOST/neondb?sslmode=require)
                    """);
        }

        overrides.put("DB_URL", dbUrl);
        overrides.put("spring.datasource.url", dbUrl);
        overrides.put("spring.datasource.driver-class-name", POSTGRES_DRIVER);
        if (!isBlank(dbUser)) {
            overrides.put("DB_USER", dbUser);
            overrides.put("spring.datasource.username", dbUser);
        }
        if (!isBlank(dbPassword)) {
            overrides.put("DB_PASSWORD", dbPassword);
            overrides.put("spring.datasource.password", dbPassword);
        }

        environment.getPropertySources().addFirst(new MapPropertySource(SOURCE, overrides));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    /**
     * En este punto {@code acceptsProfiles} puede aún no ver {@code prod};
     * Render/Docker inyectan {@code SPRING_PROFILES_ACTIVE} antes de cargar application.properties.
     */
    private static boolean isProd(ConfigurableEnvironment environment) {
        if (environment.acceptsProfiles(Profiles.of(DatabaseProfiles.PROD))) {
            return true;
        }
        return containsProfile(property(environment, "SPRING_PROFILES_ACTIVE"))
                || containsProfile(property(environment, "spring.profiles.active"));
    }

    /** Spring Environment ya incluye variables de OS en Render; no usar System.getenv (rompe tests locales). */
    private static String property(ConfigurableEnvironment environment, String key) {
        String value = environment.getProperty(key);
        return isBlank(value) ? null : value.trim();
    }

    private static boolean containsProfile(String profilesActive) {
        if (isBlank(profilesActive)) {
            return false;
        }
        return Arrays.stream(profilesActive.split(","))
                .map(String::trim)
                .anyMatch(DatabaseProfiles.PROD::equals);
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (!isBlank(value)) {
                return value.trim();
            }
        }
        return null;
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    /** Convierte postgresql://user:pass@host/db?params → JDBC + credenciales. */
    static ParsedPostgres parsePostgresUrl(String url) {
        if (!url.startsWith("postgres://") && !url.startsWith("postgresql://")) {
            throw new IllegalStateException("DATABASE_URL debe empezar con postgresql://");
        }
        try {
            URI uri = URI.create(url.replace("postgres://", "postgresql://"));
            if (uri.getHost() == null || uri.getPath() == null || uri.getPath().length() <= 1) {
                throw new IllegalArgumentException("host o database inválidos");
            }
            String userInfo = uri.getUserInfo();
            if (userInfo == null || !userInfo.contains(":")) {
                throw new IllegalArgumentException("falta user:password en DATABASE_URL");
            }
            int split = userInfo.indexOf(':');
            String user = userInfo.substring(0, split);
            String password = userInfo.substring(split + 1);
            String database = uri.getPath().substring(1);
            String query = uri.getQuery();
            String jdbc = "jdbc:postgresql://" + uri.getHost()
                    + (uri.getPort() > 0 ? ":" + uri.getPort() : "")
                    + "/" + database
                    + (query != null && !query.isBlank() ? "?" + query : "");
            return new ParsedPostgres(jdbc, user, password);
        } catch (IllegalStateException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalStateException("DATABASE_URL inválida: " + ex.getMessage(), ex);
        }
    }

    record ParsedPostgres(String jdbcUrl, String username, String password) {}
}
