package com.gymplatform.config;

import com.gymplatform.repository.OrganizationRepository;
import com.gymplatform.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
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
    private final UserService userService;

    public OrganizationOwnerRepair(OrganizationRepository organizationRepository, UserService userService) {
        this.organizationRepository = organizationRepository;
        this.userService = userService;
    }

    @Override
    public void run(String... args) {
        organizationRepository.findAll().forEach(org -> {
            if (userService.findGymOwner(org.getId()).isPresent()) {
                return;
            }
            String email = org.getContactEmail();
            if (email == null || email.isBlank()) {
                log.warn("Organización {} (id={}) sin administrador y sin contactEmail", org.getName(), org.getId());
                return;
            }
            userService.syncGymOwner(
                    org.getId(),
                    "Administrador",
                    org.getName(),
                    email,
                    AppConstants.DEFAULT_USER_PASSWORD
            );
            log.info("Administrador reparado para {} — login: {} / {}", org.getName(), email, AppConstants.DEFAULT_USER_PASSWORD);
        });
    }
}
