package com.gymplatform.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/** Falla al arrancar si el perfil activo no tiene DataSource configurado. */
@Component
@Order(1)
public class DatabaseProfileGuard implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseProfileGuard.class);

    private final Environment environment;

    public DatabaseProfileGuard(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (DatabaseProfiles.isKnownProfile(environment)) {
            if (DatabaseProfiles.usesLegacyPostgresProfile(environment)) {
                log.warn("Perfil 'postgres' está deprecado; usa 'dev-postgresql'");
            }
            if (environment.acceptsProfiles(org.springframework.core.env.Profiles.of(DatabaseProfiles.DEV_POSTGRESQL_TYPO))) {
                log.warn("Perfil 'dev-postgress' es un typo; usa 'dev-postgresql' en adelante");
            }
            log.info("Perfil de base de datos: {}", DatabaseProfiles.describe(environment));
            return;
        }

        String[] active = environment.getActiveProfiles();
        String profile = active.length > 0 ? active[0] : "(ninguno)";
        throw new IllegalStateException(
                "Perfil Spring desconocido: " + profile
                        + ". Usa uno de: dev, test, dev-postgresql, prod"
                        + " (¿escribiste dev-postgress con doble s?)");
    }
}
