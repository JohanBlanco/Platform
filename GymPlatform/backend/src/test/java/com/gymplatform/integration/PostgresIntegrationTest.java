package com.gymplatform.integration;

import com.gymplatform.config.DefaultAdminCredentials;
import com.gymplatform.repository.UserRepository;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Integración real con PostgreSQL (Testcontainers).
 * Ejecutar explícitamente: {@code mvn test -Dtest=PostgresIntegrationTest}
 */
@SpringBootTest
@ActiveProfiles("dev-postgresql")
@Testcontainers
@Tag("postgres")
class PostgresIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("gymplatform")
            .withUsername("gym")
            .withPassword("gymsecret");

    @DynamicPropertySource
    static void registerPgProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("app.uploads.dir", () -> "./target/test-uploads-pg");
    }

    @Autowired
    private UserRepository userRepository;

    @Test
    void startsWithPostgresAndSeedsDemo() {
        assertTrue(userRepository.findByEmailIgnoreCase("admin@fitlife.com").isPresent());
        assertTrue(userRepository.findByEmailIgnoreCase(DefaultAdminCredentials.EMAIL).isPresent());
    }
}
