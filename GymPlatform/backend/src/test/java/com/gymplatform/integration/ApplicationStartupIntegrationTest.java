package com.gymplatform.integration;

import com.gymplatform.config.DemoSeedConstants;
import com.gymplatform.repository.OrganizationRepository;
import com.gymplatform.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
class ApplicationStartupIntegrationTest {

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void loadsDemoDataAndBootstrapAdmin() {
        assertTrue(organizationRepository.findBySlug(DemoSeedConstants.ORG_SLUG).isPresent());
        assertTrue(userRepository.findByEmailIgnoreCase(DemoSeedConstants.ADMIN_EMAIL).isPresent());
        assertTrue(userRepository.findByEmailIgnoreCase("gymplatformadmin@gymplatform.local").isPresent());
    }
}
