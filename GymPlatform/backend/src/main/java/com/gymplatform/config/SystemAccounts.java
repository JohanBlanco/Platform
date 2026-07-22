package com.gymplatform.config;

import com.gymplatform.domain.entity.Organization;
import com.gymplatform.domain.entity.User;

/** Cuenta bootstrap de pruebas: puede iniciar sesión pero no aparece en listados UI. */
public final class SystemAccounts {

    private SystemAccounts() {}

    public static boolean isBootstrapUser(User user) {
        if (user == null || user.getEmail() == null) {
            return false;
        }
        return isBootstrapEmail(user.getEmail());
    }

    public static boolean isBootstrapEmail(String email) {
        return email != null
                && DefaultAdminCredentials.EMAIL.equalsIgnoreCase(email.trim());
    }

    public static boolean isBootstrapOrganization(Organization org) {
        return org != null
                && DefaultAdminCredentials.ORG_SLUG.equalsIgnoreCase(org.getSlug());
    }

    public static boolean isBootstrapOrganizationId(Long organizationId) {
        return organizationId != null && organizationId.equals(DefaultAdminCredentials.ORG_ID);
    }
}
