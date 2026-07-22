package com.gymplatform.util;

import com.gymplatform.exception.BusinessException;
import com.gymplatform.security.UserPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static UserPrincipal currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal principal)) {
            throw new BusinessException("Usuario no autenticado");
        }
        return principal;
    }

    public static Long requireOrganizationId() {
        Long orgId = currentUser().getOrganizationId();
        if (orgId == null) {
            throw new BusinessException("El usuario no pertenece a una organización");
        }
        return orgId;
    }
}
