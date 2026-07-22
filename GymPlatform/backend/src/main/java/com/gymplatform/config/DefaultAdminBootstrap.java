package com.gymplatform.config;

import com.gymplatform.domain.entity.Organization;
import com.gymplatform.repository.OrganizationRepository;
import com.gymplatform.repository.UserRepository;
import com.gymplatform.service.CustomFormService;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Administrador bootstrap oculto en la UI ({@link SystemAccounts}).
 * Si existe el gimnasio demo ({@link DemoSeedConstants#ORG_SLUG}), se adjunta a ese org.
 */
@Component
@Order(6)
public class DefaultAdminBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DefaultAdminBootstrap.class);

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final CustomFormService customFormService;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbc;
    private final Environment environment;

    public DefaultAdminBootstrap(
            OrganizationRepository organizationRepository,
            UserRepository userRepository,
            CustomFormService customFormService,
            PasswordEncoder passwordEncoder,
            JdbcTemplate jdbc,
            Environment environment) {
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
        this.customFormService = customFormService;
        this.passwordEncoder = passwordEncoder;
        this.jdbc = jdbc;
        this.environment = environment;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        long organizationId = resolveBootstrapOrganizationId();
        ensureDefaultAdmin(organizationId);
        syncIdSequences();
        printCredentials(organizationId);
    }

    /** Gimnasio demo si existe; si no, org técnica GymPlatform (prod vacío). */
    private long resolveBootstrapOrganizationId() {
        return organizationRepository
                .findBySlug(DemoSeedConstants.ORG_SLUG)
                .map(Organization::getId)
                .orElseGet(this::createBootstrapOrganization);
    }

    private long createBootstrapOrganization() {
        if (organizationRepository.findBySlug(DefaultAdminCredentials.ORG_SLUG).isPresent()) {
            return organizationRepository
                    .findBySlug(DefaultAdminCredentials.ORG_SLUG)
                    .orElseThrow()
                    .getId();
        }
        jdbc.update(
                """
                INSERT INTO organizations (
                  id, name, slug, contact_email, accent_id, season_theme,
                  subscription_status, active, created_at
                ) VALUES (?, ?, ?, ?, 'indigo', 'NONE', 'ACTIVE', TRUE, CURRENT_TIMESTAMP)
                """,
                DefaultAdminCredentials.ORG_ID,
                DefaultAdminCredentials.ORG_NAME,
                DefaultAdminCredentials.ORG_SLUG,
                DemoSeedConstants.ADMIN_EMAIL);
        customFormService.ensureSystemForms(DefaultAdminCredentials.ORG_ID);
        log.info("Organización bootstrap creada: {} (id={})",
                DefaultAdminCredentials.ORG_SLUG, DefaultAdminCredentials.ORG_ID);
        return DefaultAdminCredentials.ORG_ID;
    }

    private void ensureDefaultAdmin(long organizationId) {
        if (userRepository.findByEmailIgnoreCase(DefaultAdminCredentials.EMAIL).isPresent()) {
            jdbc.update(
                    "UPDATE users SET organization_id = ?, active = TRUE WHERE LOWER(email) = LOWER(?)",
                    organizationId,
                    DefaultAdminCredentials.EMAIL);
            return;
        }

        jdbc.update(
                """
                INSERT INTO users (
                  id, first_name, last_name, email, password_hash, organization_id,
                  active, national_id, created_at
                ) VALUES (?, 'Administrador', 'GymPlatform', ?, ?, ?, TRUE, ?, CURRENT_TIMESTAMP)
                """,
                DefaultAdminCredentials.USER_ID,
                DefaultAdminCredentials.EMAIL,
                passwordEncoder.encode(DefaultAdminCredentials.PASSWORD),
                organizationId,
                DefaultAdminCredentials.NATIONAL_ID);

        for (var role : Set.of("GYM_OWNER", "RECEPTIONIST", "INSTRUCTOR", "MEMBER")) {
            jdbc.update(
                    "INSERT INTO user_roles (user_id, role) VALUES (?, ?)",
                    DefaultAdminCredentials.USER_ID,
                    role);
        }

        log.info("Usuario bootstrap creado: {} / {} (orgId={})",
                DefaultAdminCredentials.LOGIN, DefaultAdminCredentials.PASSWORD, organizationId);
    }

    private void syncIdSequences() {
        if (DatabaseProfiles.isH2(environment)) {
            jdbc.execute("ALTER TABLE organizations ALTER COLUMN id RESTART WITH "
                    + (DefaultAdminCredentials.ORG_ID + 1));
            jdbc.execute("ALTER TABLE users ALTER COLUMN id RESTART WITH "
                    + (DefaultAdminCredentials.USER_ID + 1));
            return;
        }
        bumpSequence("organizations", DefaultAdminCredentials.ORG_ID);
        bumpSequence("users", DefaultAdminCredentials.USER_ID);
    }

    private void bumpSequence(String table, long minimum) {
        jdbc.queryForObject(
                """
                SELECT setval(
                  pg_get_serial_sequence(?, 'id'),
                  GREATEST(?, (SELECT COALESCE(MAX(id), 0) FROM %s)),
                  true)
                """
                        .formatted(table),
                Long.class,
                table,
                minimum);
    }

    static void printCredentials(long organizationId) {
        System.out.println("=== Administrador bootstrap (oculto en UI, solo pruebas) ===");
        System.out.println("Login:          " + DefaultAdminCredentials.LOGIN);
        System.out.println("Contraseña:     " + DefaultAdminCredentials.PASSWORD);
        System.out.println("Organización:   id " + organizationId
                + " (demo " + DemoSeedConstants.ORG_SLUG + " si existe, si no slug "
                + DefaultAdminCredentials.ORG_SLUG + ")");
        System.out.println("============================================================");
    }
}
