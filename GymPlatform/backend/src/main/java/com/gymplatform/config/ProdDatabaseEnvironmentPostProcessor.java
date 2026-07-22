package com.gymplatform.config;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/**
 * En prod, normaliza credenciales Neon/Render:
 * <ul>
 *   <li>{@code DB_URL} + {@code DB_USER} + {@code DB_PASSWORD} (preferido)</li>
 *   <li>{@code SPRING_DATASOURCE_*} (estándar Spring Boot)</li>
 *   <li>{@code DATABASE_URL=postgresql://...} (Neon / Render)</li>
 * </ul>
 */
public class ProdDatabaseEnvironmentPostProcessor implements EnvironmentPostProcessor {

    private static final String SOURCE = "gymplatformProdDatabase";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        if (!isProd(environment)) {
            return;
        }

        Map<String, Object> overrides = new HashMap<>();

        String dbUrl = firstNonBlank(
                environment.getProperty("DB_URL"),
                environment.getProperty("SPRING_DATASOURCE_URL"));

        String dbUser = firstNonBlank(
                environment.getProperty("DB_USER"),
                environment.getProperty("SPRING_DATASOURCE_USERNAME"));

        String dbPassword = firstNonBlank(
                environment.getProperty("DB_PASSWORD"),
                environment.getProperty("SPRING_DATASOURCE_PASSWORD"));

        String databaseUrl = environment.getProperty("DATABASE_URL");
        if (isBlank(dbUrl) && !isBlank(databaseUrl)) {
            ParsedPostgres parsed = parsePostgresUrl(databaseUrl.trim());
            dbUrl = parsed.jdbcUrl();
            if (isBlank(dbUser)) {
                dbUser = parsed.username();
            }
            if (isBlank(dbPassword)) {
                dbPassword = parsed.password();
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
        if (!isBlank(dbUser)) {
            overrides.put("DB_USER", dbUser);
        }
        if (!isBlank(dbPassword)) {
            overrides.put("DB_PASSWORD", dbPassword);
        }

        environment.getPropertySources().addFirst(new MapPropertySource(SOURCE, overrides));
    }

    private static boolean isProd(ConfigurableEnvironment environment) {
        return environment.acceptsProfiles(org.springframework.core.env.Profiles.of(DatabaseProfiles.PROD));
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
