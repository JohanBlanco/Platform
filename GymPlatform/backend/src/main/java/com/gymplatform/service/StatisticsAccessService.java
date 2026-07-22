package com.gymplatform.service;

import com.gymplatform.domain.entity.Organization;
import com.gymplatform.domain.entity.OrganizationStatisticsAccess;
import com.gymplatform.dto.StatisticsAccessChangeRequest;
import com.gymplatform.dto.StatisticsAccessResponse;
import com.gymplatform.dto.StatisticsAccessSetRequest;
import com.gymplatform.dto.StatisticsUnlockRequest;
import com.gymplatform.dto.StatisticsUnlockResponse;
import com.gymplatform.exception.BusinessException;
import com.gymplatform.exception.ResourceNotFoundException;
import com.gymplatform.repository.OrganizationRepository;
import com.gymplatform.repository.OrganizationStatisticsAccessRepository;
import com.gymplatform.security.JwtTokenProvider;
import com.gymplatform.security.UserPrincipal;
import com.gymplatform.util.SecurityUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StatisticsAccessService {

    private final OrganizationStatisticsAccessRepository accessRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public StatisticsAccessService(
            OrganizationStatisticsAccessRepository accessRepository,
            OrganizationRepository organizationRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider) {
        this.accessRepository = accessRepository;
        this.organizationRepository = organizationRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional(readOnly = true)
    public StatisticsAccessResponse getAccess(Long organizationId) {
        requireOwner();
        return new StatisticsAccessResponse(isConfigured(organizationId));
    }

    @Transactional(readOnly = true)
    public boolean isConfigured(Long organizationId) {
        return accessRepository.findByOrganizationId(organizationId)
                .map(OrganizationStatisticsAccess::isConfigured)
                .orElse(false);
    }

    @Transactional
    public StatisticsAccessResponse setPassword(Long organizationId, StatisticsAccessSetRequest request) {
        requireOwner();
        OrganizationStatisticsAccess access = getOrCreate(organizationId);
        if (access.isConfigured()) {
            throw new BusinessException("La contraseña ya está configurada. Usa «Cambiar» para actualizarla.");
        }
        String password = request.password().trim();
        validatePasswordStrength(password);
        access.setPasswordHash(passwordEncoder.encode(password));
        access.setUpdatedAt(java.time.Instant.now());
        accessRepository.save(access);
        return new StatisticsAccessResponse(true);
    }

    @Transactional
    public StatisticsAccessResponse changePassword(Long organizationId, StatisticsAccessChangeRequest request) {
        requireOwner();
        OrganizationStatisticsAccess access = accessRepository.findByOrganizationId(organizationId)
                .orElseThrow(() -> new BusinessException("Primero configura la contraseña de áreas privadas"));
        if (!access.isConfigured()) {
            throw new BusinessException("Primero configura la contraseña de áreas privadas");
        }
        if (!passwordEncoder.matches(request.currentPassword(), access.getPasswordHash())) {
            throw new BusinessException("La contraseña actual no es correcta");
        }
        String next = request.newPassword().trim();
        validatePasswordStrength(next);
        access.setPasswordHash(passwordEncoder.encode(next));
        access.setUpdatedAt(java.time.Instant.now());
        accessRepository.save(access);
        return new StatisticsAccessResponse(true);
    }

    @Transactional(readOnly = true)
    public StatisticsUnlockResponse unlock(Long organizationId, StatisticsUnlockRequest request) {
        requireStatsViewer();
        if (!isConfigured(organizationId)) {
            throw new BusinessException(
                    "El administrador debe definir la contraseña de áreas privadas en Configuración");
        }
        OrganizationStatisticsAccess access = accessRepository.findByOrganizationId(organizationId)
                .orElseThrow(() -> new BusinessException(
                        "El administrador debe definir la contraseña de áreas privadas en Configuración"));
        if (!passwordEncoder.matches(request.password(), access.getPasswordHash())) {
            throw new BusinessException("Contraseña incorrecta");
        }
        UserPrincipal user = SecurityUtils.currentUser();
        String token = jwtTokenProvider.generateStatsUnlockToken(user.getId(), organizationId);
        return new StatisticsUnlockResponse(token, jwtTokenProvider.statsUnlockExpiry(token));
    }

    public void requireValidUnlock(Long organizationId, String unlockToken) {
        requireStatsViewer();
        if (unlockToken == null || unlockToken.isBlank()) {
            throw new BusinessException("Debes desbloquear esta área con la contraseña de áreas privadas");
        }
        UserPrincipal user = SecurityUtils.currentUser();
        if (!jwtTokenProvider.validateStatsUnlockToken(unlockToken, organizationId, user.getId())) {
            throw new BusinessException("Sesión de área privada expirada o inválida. Vuelve a desbloquear.");
        }
    }

    private OrganizationStatisticsAccess getOrCreate(Long organizationId) {
        return accessRepository.findByOrganizationId(organizationId).orElseGet(() -> {
            Organization org = organizationRepository.findById(organizationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));
            OrganizationStatisticsAccess created = new OrganizationStatisticsAccess();
            created.setOrganization(org);
            return accessRepository.save(created);
        });
    }

    private void validatePasswordStrength(String password) {
        if (password.length() < 4) {
            throw new BusinessException("La contraseña debe tener al menos 4 caracteres");
        }
    }

    private void requireOwner() {
        UserPrincipal user = SecurityUtils.currentUser();
        if (!user.hasRole("GYM_OWNER")) {
            throw new BusinessException("Solo el administrador puede configurar la contraseña de áreas privadas");
        }
    }

    private void requireStatsViewer() {
        UserPrincipal user = SecurityUtils.currentUser();
        if (!user.hasRole("GYM_OWNER") && !user.hasRole("RECEPTIONIST")) {
            throw new BusinessException("No tienes permiso para ver esta área privada");
        }
    }
}
