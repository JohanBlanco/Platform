package com.gymplatform.config;

import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import com.gymplatform.service.CustomFormService;

/**
 * BD mínima para Cypress local: org demo + recepcionista / instructor / miembro / admin.
 * Sin productos, membresías, actividades ni ventas (los crean los tests).
 */
@Component
@Order(4)
@ConditionalOnProperty(name = "app.e2e.minimal-seed", havingValue = "true")
public class E2eMinimalSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(E2eMinimalSeeder.class);
    private static final long E2E_ORG_ID = 1L;

    private final DataSource dataSource;
    private final JdbcTemplate jdbc;
    private final CustomFormService customFormService;

    public E2eMinimalSeeder(
            DataSource dataSource,
            JdbcTemplate jdbc,
            CustomFormService customFormService) {
        this.dataSource = dataSource;
        this.jdbc = jdbc;
        this.customFormService = customFormService;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Integer existing = jdbc.queryForObject(
                "SELECT COUNT(*) FROM organizations WHERE slug = ?",
                Integer.class,
                DemoSeedConstants.ORG_SLUG);
        if (existing != null && existing > 0) {
            log.info("E2E minimal seed omitido: ya existe org {}", DemoSeedConstants.ORG_SLUG);
            return;
        }

        ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
        populator.addScript(new ClassPathResource("db/e2e-minimal.sql"));
        populator.execute(dataSource);

        customFormService.ensureSystemForms(E2E_ORG_ID);
        syncH2Sequences();

        log.info("=== E2E minimal seed ===");
        log.info("Recepcionista: {} / recepcion123", DemoSeedConstants.RECEPTION_EMAIL);
        log.info("Instructor:    {} / instructor123", DemoSeedConstants.INSTRUCTOR_EMAIL);
        log.info("Miembro:       {} / miembro123", DemoSeedConstants.MEMBER_EMAIL);
        log.info("Admin:         {} / 12345678", DemoSeedConstants.ADMIN_EMAIL);
        log.info("Bootstrap:     gymplatformadmin / gymplatformadmin");
        log.info("========================");
    }

    private void syncH2Sequences() {
        jdbc.execute("ALTER TABLE organizations ALTER COLUMN id RESTART WITH 2");
        jdbc.execute("ALTER TABLE users ALTER COLUMN id RESTART WITH 6");
    }
}
