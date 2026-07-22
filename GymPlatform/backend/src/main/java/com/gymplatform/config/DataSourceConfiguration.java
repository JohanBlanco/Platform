package com.gymplatform.config;

import com.zaxxer.hikari.HikariDataSource;
import javax.sql.DataSource;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

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
    public DataSource prodDataSource(DataSourceProperties properties) {
        return buildDataSource(properties, "prod");
    }

    private static DataSource buildDataSource(DataSourceProperties properties, String profileLabel) {
        HikariDataSource dataSource = properties.initializeDataSourceBuilder()
                .type(HikariDataSource.class)
                .build();
        dataSource.setPoolName("gymplatform-" + profileLabel);
        return dataSource;
    }
}
