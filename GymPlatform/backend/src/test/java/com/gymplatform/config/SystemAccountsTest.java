package com.gymplatform.config;

import com.gymplatform.domain.entity.Organization;
import com.gymplatform.domain.entity.User;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SystemAccountsTest {

    @Test
    void detectsBootstrapUserByEmail() {
        User user = new User();
        user.setEmail(DefaultAdminCredentials.EMAIL);

        assertTrue(SystemAccounts.isBootstrapUser(user));
        assertTrue(SystemAccounts.isBootstrapEmail(DefaultAdminCredentials.EMAIL));
        assertTrue(SystemAccounts.isBootstrapEmail("  " + DefaultAdminCredentials.EMAIL.toUpperCase() + "  "));
    }

    @Test
    void ignoresRegularUsersAndNulls() {
        User user = new User();
        user.setEmail("admin@fitlife.com");

        assertFalse(SystemAccounts.isBootstrapUser(null));
        assertFalse(SystemAccounts.isBootstrapUser(user));
        assertFalse(SystemAccounts.isBootstrapEmail(null));
        assertFalse(SystemAccounts.isBootstrapEmail("admin@fitlife.com"));
    }

    @Test
    void detectsBootstrapOrganization() {
        Organization org = new Organization();
        org.setSlug(DefaultAdminCredentials.ORG_SLUG);

        assertTrue(SystemAccounts.isBootstrapOrganization(org));
        assertTrue(SystemAccounts.isBootstrapOrganizationId(DefaultAdminCredentials.ORG_ID));
        assertFalse(SystemAccounts.isBootstrapOrganizationId(1L));
    }
}
