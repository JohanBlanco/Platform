package com.gymplatform.config;

import com.zaxxer.hikari.HikariDataSource;
import javax.sql.DataSource;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;

/**
 * Un bean {@link DataSource} por perfil activo.
 * Propiedades JDBC en {@code application-<perfil>.properties} bajo {@code spring.datasource.*}.
 */
@Configuration
public class DataSourceConfiguration {

    @Bean
    @Profile({DatabaseProfiles.DEV, DatabaseProfiles.TEST})
    public DataSource devDataSource(DataSourceProperties properties) {
        return buildDataSource(properties, "dev");
    }

    @Bean
    @Profile({DatabaseProfiles.DEV_POSTGRESQL, DatabaseProfiles.DEV_POSTGRESQL_TYPO})
    public DataSource devPostgresqlDataSource(DataSourceProperties properties) {
        return buildDataSource(properties, "dev-postgresql");
    }

    /** Alias legacy del perfil {@code dev-postgresql}. */
    @Bean
    @Profile(DatabaseProfiles.LEGACY_POSTGRES)
    public DataSource legacyPostgresDataSource(DataSourceProperties properties) {
        return buildDataSource(properties, "postgres-legacy");
    }

    @Bean
    @Profile(DatabaseProfiles.PROD)
    public DataSource prodDataSource(Environment environment) {
        String url = environment.getProperty("spring.datasource.url");
        String username = environment.getProperty("spring.datasource.username", "");
        String password = environment.getProperty("spring.datasource.password", "");
        requirePostgresJdbcUrl(url);

        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setPoolName("gymplatform-prod");
        dataSource.setDriverClassName("org.postgresql.Driver");
        dataSource.setJdbcUrl(url);
        dataSource.setUsername(username);
        dataSource.setPassword(password);
        return dataSource;
    }

    private static void requirePostgresJdbcUrl(String url) {
        if (url == null || !url.startsWith("jdbc:postgresql:")) {
            throw new IllegalStateException(
                    """
                    Perfil prod requiere una URL PostgreSQL (jdbc:postgresql://...).
                    En Render → Environment configura DB_URL, DB_USER y DB_PASSWORD
                    (o DATABASE_URL=postgresql://USER:PASS@HOST/neondb?sslmode=require).
                    """);
        }
    }

    private static DataSource buildDataSource(DataSourceProperties properties, String profileLabel) {
        HikariDataSource dataSource = properties.initializeDataSourceBuilder()
                .type(HikariDataSource.class)
                .build();
        dataSource.setPoolName("gymplatform-" + profileLabel);
        return dataSource;
    }
}
