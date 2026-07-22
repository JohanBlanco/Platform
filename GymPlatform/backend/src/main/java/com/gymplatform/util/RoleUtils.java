package com.gymplatform.util;

import com.gymplatform.domain.enums.Role;
import com.gymplatform.exception.BusinessException;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public final class RoleUtils {

    private RoleUtils() {}

    public static Set<Role> normalizeGymRoles(List<Role> roles) {
        if (roles == null || roles.isEmpty()) {
            throw new BusinessException("Debe asignar al menos un rol");
        }
        Set<Role> normalized = roles.stream()
                .filter(r -> r != Role.PLATFORM_OWNER)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        if (normalized.isEmpty()) {
            throw new BusinessException("No se puede asignar el rol PLATFORM_OWNER en un gimnasio");
        }
        return normalized;
    }

    public static List<String> toNames(Set<Role> roles) {
        return roles.stream().map(Role::name).toList();
    }

    public static boolean isPlatformUser(Set<Role> roles) {
        return roles.contains(Role.PLATFORM_OWNER);
    }

    public static boolean isGymStaff(Set<Role> roles) {
        return roles.stream().anyMatch(r -> r == Role.GYM_OWNER || r == Role.INSTRUCTOR || r == Role.RECEPTIONIST);
    }

    public static EnumSet<Role> gymAssignableRoles() {
        return EnumSet.of(Role.GYM_OWNER, Role.RECEPTIONIST, Role.INSTRUCTOR, Role.MEMBER);
    }
}
