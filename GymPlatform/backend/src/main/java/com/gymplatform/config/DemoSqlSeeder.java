package com.gymplatform.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

/**
 * Carga datos demo desde SQL.
 * H2: {@code db/demo-seed*.sql} · PostgreSQL: {@code db/postgres/demo-seed*.sql}
 */
@Component
@Order(5)
public class DemoSqlSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoSqlSeeder.class);
    private static final String SCRIPT_CORE = "db/demo-seed.sql";
    private static final String SCRIPT_SALES = "db/demo-seed-sales.sql";
    private static final String SCRIPT_MEMBER = "db/demo-seed-member.sql";
    private static final String SCRIPT_MEMBER_STAFF = "db/demo-seed-member-staff.sql";
    /** BCrypt de 12345678 (mismas cuentas demo). */
    private static final String PRIVATE_AREA_HASH =
            "$2a$10$aZ8ODce.PMKUkYFMVLPIRecG4Dc2tbnHwYdRJuCre6PfScQzioAi2";

    private final DataSource dataSource;
    private final JdbcTemplate jdbc;
    private final ActivityImageSeeder activityImageSeeder;
    private final Environment environment;
    private final boolean demoSeedEnabled;

    public DemoSqlSeeder(
            DataSource dataSource,
            JdbcTemplate jdbc,
            ActivityImageSeeder activityImageSeeder,
            Environment environment,
            @Value("${app.demo.seed-enabled:true}") boolean demoSeedEnabled) {
        this.dataSource = dataSource;
        this.jdbc = jdbc;
        this.activityImageSeeder = activityImageSeeder;
        this.environment = environment;
        this.demoSeedEnabled = demoSeedEnabled;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!demoSeedEnabled) {
            log.info("Demo SQL omitido (app.demo.seed-enabled=false, perfil {})",
                    DatabaseProfiles.describe(environment));
            return;
        }

        if (DatabaseProfiles.usesLegacyPostgresProfile(environment)) {
            log.warn("Perfil 'postgres' está deprecado; usa 'dev-postgresql'");
        }

        activityImageSeeder.ensureDemoImages();

        Integer fitlife = jdbc.queryForObject(
                "SELECT COUNT(*) FROM organizations WHERE slug = 'fitlife'", Integer.class);
        if (fitlife == null || fitlife == 0) {
            if (demoCoreBlockedByReservedIds()) {
                log.warn(
                        "Demo SQL core omitido: IDs 1–3 ya ocupados (p. ej. bootstrap previo en id=1). "
                                + "Resetea PostgreSQL: docker compose down -v && docker compose up -d");
            } else {
                runScript(SCRIPT_CORE);
            }
        } else {
            log.info("Demo SQL core omitido: ya existe organización fitlife");
        }

        ensureFitLifeIndigo();
        ensurePrivateAreasPassword();
        ensureAdminEmailAndDisablePlatform();
        ensureSalesDemo();
        ensureMemberDemo();
        ensureMemberStaffDemo();
        ensureLiveActivityPromotions();
        printHints();
    }

    /** Renombra dueño→admin y desactiva cuenta PLATFORM_OWNER en DBs ya existentes. */
    private void ensureAdminEmailAndDisablePlatform() {
        int renamed = jdbc.update(
                "UPDATE users SET email = 'admin@fitlife.com' WHERE email = 'dueno@fitlife.com'");
        if (renamed > 0) {
            log.info("Email demo renombrado: dueno@fitlife.com → admin@fitlife.com");
        }
        int disabled = jdbc.update(
                "UPDATE users SET active = FALSE WHERE email = 'admin@gymplatform.com'");
        disabled += jdbc.update(
                """
                UPDATE users SET active = FALSE
                WHERE id IN (SELECT ur.user_id FROM user_roles ur WHERE ur.role = 'PLATFORM_OWNER')
                """);
        if (disabled > 0) {
            log.info("Cuentas PLATFORM_OWNER desactivadas ({})", disabled);
        }
    }

    private void ensureSalesDemo() {
        Long orgId = fitLifeOrgId();
        if (orgId == null) {
            return;
        }
        Integer sales = jdbc.queryForObject(
                "SELECT COUNT(*) FROM store_sales WHERE organization_id = ?", Integer.class, orgId);
        if (sales != null && sales > 0) {
            log.info("Demo ventas omitido: ya hay {} ventas en FitLife", sales);
            return;
        }
        runScript(SCRIPT_SALES);
    }

    private void ensureMemberDemo() {
        Long orgId = fitLifeOrgId();
        if (orgId == null) {
            return;
        }
        Integer routines = jdbc.queryForObject(
                """
                SELECT COUNT(*) FROM routines r
                JOIN users u ON u.id = r.member_id
                WHERE u.email = 'miembro@fitlife.com'
                """,
                Integer.class);
        if (routines != null && routines > 0) {
            log.info("Demo miembro omitido: ya hay rutinas para miembro@fitlife.com");
            return;
        }
        runScript(SCRIPT_MEMBER);
    }

    /** Datos para administrador/recepción al usar perfil Miembro (switch de roles). */
    private void ensureMemberStaffDemo() {
        Long orgId = fitLifeOrgId();
        if (orgId == null) {
            return;
        }
        Integer routines = jdbc.queryForObject(
                """
                SELECT COUNT(*) FROM routines r
                JOIN users u ON u.id = r.member_id
                WHERE u.email IN ('admin@fitlife.com', 'dueno@fitlife.com')
                """,
                Integer.class);
        if (routines != null && routines > 0) {
            log.info("Demo miembro-staff omitido: ya hay rutinas para admin@fitlife.com");
            return;
        }
        runScript(SCRIPT_MEMBER_STAFF);
    }

    /**
     * Asegura que el carrusel del miembro tenga promociones con actividades vigentes.
     * Corrige seeds viejos (slot 0 / actividades de un solo día ya vencidas).
     */
    private void ensureLiveActivityPromotions() {
        Long orgId = fitLifeOrgId();
        if (orgId == null) {
            return;
        }
        Integer live = jdbc.queryForObject(
                """
                SELECT COUNT(*) FROM activity_promotions p
                JOIN activities a ON a.id = p.activity_id
                WHERE p.organization_id = ?
                  AND a.active = TRUE
                  AND a.end_date >= CURRENT_DATE
                  AND (
                    (a.recurring = TRUE AND a.repeat_days IS NOT NULL AND TRIM(a.repeat_days) <> '')
                    OR a.start_date >= CURRENT_DATE
                  )
                """,
                Integer.class,
                orgId);
        if (live != null && live > 0) {
            log.info("Promociones de actividades OK ({} con próxima fecha)", live);
            return;
        }

        // Vaciar y recrear slots 1–3 con Pilates / Yoga / HIIT (ids demo 12, 9, 10)
        jdbc.update("DELETE FROM activity_promotions WHERE organization_id = ?", orgId);
        Integer pilates = jdbc.queryForObject(
                "SELECT COUNT(*) FROM activities WHERE id = 12 AND organization_id = ?", Integer.class, orgId);
        Integer yoga = jdbc.queryForObject(
                "SELECT COUNT(*) FROM activities WHERE id = 9 AND organization_id = ?", Integer.class, orgId);
        Integer hiit = jdbc.queryForObject(
                "SELECT COUNT(*) FROM activities WHERE id = 10 AND organization_id = ?", Integer.class, orgId);
        if (pilates == null || pilates == 0 || yoga == null || yoga == 0 || hiit == null || hiit == 0) {
            log.warn("No se pudieron restaurar promociones demo: faltan actividades 9/10/12");
            return;
        }
        // Extender vigencia por si las fechas demo ya pasaron
        boolean postgres = DatabaseProfiles.isPostgres(environment);
        String monthAhead = DemoSeedSqlDialect.dateAdd("MONTH", 1, "CURRENT_DATE", postgres);
        jdbc.update(
                """
                UPDATE activities SET
                  end_date = CASE
                    WHEN end_date < %s
                    THEN %s ELSE end_date END,
                  start_date = CASE
                    WHEN recurring = FALSE AND start_date < CURRENT_DATE
                    THEN CURRENT_DATE ELSE start_date END
                WHERE id IN (9, 10, 12) AND organization_id = ?
                """
                        .formatted(monthAhead, monthAhead),
                orgId);
        jdbc.update(
                """
                INSERT INTO activity_promotions
                  (organization_id, activity_id, slot_index, image_url, created_at, updated_at)
                VALUES
                  (?, 12, 1, '/uploads/marketing/promo-pilates.jpg', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                  (?, 9, 2, '/uploads/marketing/promo-yoga.jpg', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                  (?, 10, 3, '/uploads/marketing/promo-hiit.jpg', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """,
                orgId, orgId, orgId);
        log.info("Promociones de actividades demo restauradas (Pilates, Yoga, HIIT)");
    }

    private void ensurePrivateAreasPassword() {
        Long orgId = fitLifeOrgId();
        if (orgId == null) {
            return;
        }
        Integer configured = jdbc.queryForObject(
                """
                SELECT COUNT(*) FROM organization_statistics_access
                WHERE organization_id = ?
                  AND password_hash IS NOT NULL
                  AND TRIM(password_hash) <> ''
                """,
                Integer.class,
                orgId);
        if (configured != null && configured > 0) {
            return;
        }
        Integer existing = jdbc.queryForObject(
                "SELECT COUNT(*) FROM organization_statistics_access WHERE organization_id = ?",
                Integer.class,
                orgId);
        if (existing != null && existing > 0) {
            jdbc.update(
                    "UPDATE organization_statistics_access SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE organization_id = ?",
                    PRIVATE_AREA_HASH,
                    orgId);
        } else {
            jdbc.update(
                    "INSERT INTO organization_statistics_access (organization_id, password_hash, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
                    orgId,
                    PRIVATE_AREA_HASH);
        }
        log.info("Contraseña de áreas privadas demo configurada para FitLife (12345678)");
    }

    private void ensureFitLifeIndigo() {
        int updated = jdbc.update(
                "UPDATE organizations SET accent_id = 'indigo' WHERE slug = 'fitlife' AND (accent_id IS NULL OR LOWER(accent_id) <> 'indigo')");
        if (updated > 0) {
            log.info("Acento FitLife ajustado a indigo (default GymPlatform)");
        }
    }

    private Long fitLifeOrgId() {
        try {
            return jdbc.query(
                    "SELECT id FROM organizations WHERE slug = 'fitlife'",
                    rs -> rs.next() ? rs.getLong(1) : null);
        } catch (Exception ex) {
            return null;
        }
    }

    /** Evita insertar demo FitLife (ids 1–3) si ya hay filas en esos IDs. */
    private boolean demoCoreBlockedByReservedIds() {
        Integer occupied = jdbc.queryForObject(
                "SELECT COUNT(*) FROM organizations WHERE id IN (1, 2, 3)", Integer.class);
        return occupied != null && occupied > 0;
    }

    private void runScript(String classpath) {
        log.info("Cargando datos demo desde classpath:{}", classpath);
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
        populator.setContinueOnError(false);
        populator.setSeparator(";");
        populator.setSqlScriptEncoding(StandardCharsets.UTF_8.name());
        try {
            String sql = loadScriptSql(classpath);
            populator.addScript(new ByteArrayResource(sql.getBytes(StandardCharsets.UTF_8)));
        } catch (IOException ex) {
            throw new IllegalStateException("No se pudo leer script demo: " + classpath, ex);
        }
        populator.execute(dataSource);
        log.info("Datos demo cargados desde {}", classpath);
    }

    private String loadScriptSql(String h2Classpath) throws IOException {
        if (!DatabaseProfiles.isPostgres(environment)) {
            ClassPathResource h2 = new ClassPathResource(h2Classpath);
            return StreamUtils.copyToString(h2.getInputStream(), StandardCharsets.UTF_8);
        }
        String postgresPath = DatabaseProfiles.demoSeedPath(h2Classpath, environment);
        ClassPathResource postgres = new ClassPathResource(postgresPath);
        if (postgres.exists()) {
            log.info("Usando seed PostgreSQL: {}", postgresPath);
            return StreamUtils.copyToString(postgres.getInputStream(), StandardCharsets.UTF_8);
        }
        log.warn("Seed PostgreSQL no encontrado ({}), traduciendo desde H2", postgresPath);
        ClassPathResource h2 = new ClassPathResource(h2Classpath);
        return DemoSeedSqlDialect.toPostgres(StreamUtils.copyToString(h2.getInputStream(), StandardCharsets.UTF_8));
    }

    private void printHints() {
        if (!demoSeedEnabled) {
            return;
        }
        String seedDir = DatabaseProfiles.isPostgres(environment) ? "db/postgres/demo-seed*.sql" : "db/demo-seed*.sql";
        System.out.println("=== Datos demo FitLife (perfil " + DatabaseProfiles.describe(environment)
                + ", fuente: " + seedDir + ") ===");
        System.out.println("Administrador:  admin@fitlife.com / 12345678");
        System.out.println("Recepcionista:  recepcion@fitlife.com / recepcion123");
        System.out.println("Instructor:     instructor@fitlife.com / instructor123");
        System.out.println("Miembro:        miembro@fitlife.com / miembro123");
        System.out.println("  → Rutinas, nutrición, medidas, reservas y citas (demo-seed-member.sql)");
        System.out.println("  → Admin/recepción en perfil Miembro: demo-seed-member-staff.sql");
        System.out.println("Areas privadas: 12345678  |  Color demo: indigo");
        System.out.println("===============================================================");
    }
}
