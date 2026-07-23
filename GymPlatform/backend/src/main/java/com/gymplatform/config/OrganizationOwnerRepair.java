package com.gymplatform.config;

import com.gymplatform.domain.enums.Role;
import com.gymplatform.domain.entity.Organization;
import com.gymplatform.domain.entity.User;
import com.gymplatform.repository.OrganizationRepository;
import com.gymplatform.repository.UserRepository;
import com.gymplatform.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Crea el GYM_OWNER si una organización existe pero no tiene administrador
 * (p. ej. gimnasios creados antes de la auto-provisión de cuenta).
 */
@Component
@Order(100)
public class OrganizationOwnerRepair implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(OrganizationOwnerRepair.class);

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final JdbcTemplate jdbc;

    public OrganizationOwnerRepair(
            OrganizationRepository organizationRepository,
            UserRepository userRepository,
            UserService userService,
            JdbcTemplate jdbc) {
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
        this.userService = userService;
        this.jdbc = jdbc;
    }

    @Override
    public void run(String... args) {
        removeBootstrapOrgDuplicateOwners();
        organizationRepository.findAll().forEach(org -> {
            if (shouldSkipOwnerRepair(org)) {
                return;
            }
            if (userService.organizationHasGymOwner(org.getId())) {
                return;
            }
            String email = org.getContactEmail();
            if (email == null || email.isBlank()) {
                log.warn("Organización {} (id={}) sin administrador y sin contactEmail", org.getName(), org.getId());
                return;
            }
            try {
                userService.syncGymOwner(
                        org.getId(),
                        "Administrador",
                        org.getName(),
                        email,
                        AppConstants.DEFAULT_USER_PASSWORD
                );
                log.info("Administrador reparado para {} — login: {} / {}", org.getName(), email, AppConstants.DEFAULT_USER_PASSWORD);
            } catch (com.gymplatform.exception.BusinessException ex) {
                log.warn("No se pudo reparar administrador para {} (id={}): {}",
                        org.getName(), org.getId(), ex.getMessage());
            }
        });
    }

    /** Org técnica bootstrap: el admin real es gymplatformadmin, no contactEmail de la org. */
    private boolean shouldSkipOwnerRepair(Organization org) {
        return SystemAccounts.isBootstrapOrganization(org)
                && userRepository.findByEmailIgnoreCase(DefaultAdminCredentials.EMAIL).isPresent();
    }

    /**
     * En org técnica bootstrap, {@link UserService#findGymOwner} ignora al bootstrap y antes
     * se creaba un admin duplicado con {@link DemoSeedConstants#ADMIN_EMAIL}.
     */
    private void removeBootstrapOrgDuplicateOwners() {
        organizationRepository.findBySlug(DefaultAdminCredentials.ORG_SLUG).ifPresent(org -> {
            if (userRepository.findByEmailIgnoreCase(DefaultAdminCredentials.EMAIL).isEmpty()) {
                return;
            }
            for (User duplicate : userRepository.findByOrganizationIdAndRole(org.getId(), Role.GYM_OWNER)) {
                if (SystemAccounts.isBootstrapUser(duplicate)) {
                    continue;
                }
                log.info("Eliminando administrador duplicado en org bootstrap: {} (id={})",
                        duplicate.getEmail(), duplicate.getId());
                jdbc.update("DELETE FROM user_roles WHERE user_id = ?", duplicate.getId());
                jdbc.update("DELETE FROM users WHERE id = ?", duplicate.getId());
            }
        });
    }
}
