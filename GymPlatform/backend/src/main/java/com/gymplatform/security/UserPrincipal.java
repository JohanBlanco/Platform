package com.gymplatform.security;

import com.gymplatform.domain.entity.User;
import com.gymplatform.util.RoleUtils;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Collection;
import java.util.List;

public class UserPrincipal implements UserDetails {

    private final Long id;
    private final String email;
    private final String password;
    private final List<String> roles;
    private final Long organizationId;
    private final boolean active;

    public UserPrincipal(Long id, String email, String password, List<String> roles, Long organizationId, boolean active) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.roles = roles;
        this.organizationId = organizationId;
        this.active = active;
    }

    public static UserPrincipal from(User user) {
        Long orgId = user.getOrganization() != null ? user.getOrganization().getId() : null;
        return new UserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getPasswordHash(),
                RoleUtils.toNames(user.getRoles()),
                orgId,
                user.isActive()
        );
    }

    public Long getId() { return id; }
    public Long getOrganizationId() { return organizationId; }
    public List<String> getRoles() { return roles; }

    public boolean hasRole(String role) {
        return roles.contains(role);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .toList();
    }

    @Override
    public String getPassword() { return password; }

    @Override
    public String getUsername() { return email; }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return active; }
}
