package com.gymplatform.service;

import com.gymplatform.config.SystemAccounts;
import com.gymplatform.domain.entity.Organization;
import com.gymplatform.domain.entity.User;
import com.gymplatform.domain.enums.Role;
import com.gymplatform.domain.enums.SubscriptionStatus;
import com.gymplatform.dto.GymOrganizationResponse;
import com.gymplatform.dto.GymOrganizationUpdateRequest;
import com.gymplatform.dto.OrganizationRequest;
import com.gymplatform.dto.OrganizationResponse;
import com.gymplatform.dto.UserCreateRequest;
import com.gymplatform.exception.BusinessException;
import com.gymplatform.exception.ResourceNotFoundException;
import com.gymplatform.repository.OrganizationRepository;
import com.gymplatform.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Set;

@Service
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final CustomFormService customFormService;
    private final PasswordEncoder passwordEncoder;

    private static final Set<String> ALLOWED_ACCENTS = Set.of("indigo", "emerald", "rose", "amber", "sky");

    public OrganizationService(OrganizationRepository organizationRepository,
                               UserRepository userRepository,
                               UserService userService,
                               CustomFormService customFormService,
                               PasswordEncoder passwordEncoder) {
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
        this.userService = userService;
        this.customFormService = customFormService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public OrganizationResponse create(OrganizationRequest request) {
        if (organizationRepository.findBySlug(request.slug()).isPresent()) {
            throw new BusinessException("El slug ya está en uso");
        }
        if (userRepository.existsByEmail(request.ownerEmail())) {
            throw new BusinessException("El correo del administrador ya está registrado");
        }

        Organization org = new Organization();
        org.setName(request.name());
        org.setSlug(request.slug());
        org.setContactEmail(resolveContactEmail(request));
        org.setContactPhone(request.contactPhone());
        if (request.subscriptionStatus() != null) {
            org.setSubscriptionStatus(request.subscriptionStatus());
        }
        org = organizationRepository.save(org);
        customFormService.ensureSystemForms(org.getId());

        userService.createStaff(org.getId(), new UserCreateRequest(
                request.ownerFirstName(),
                request.ownerLastName(),
                request.ownerEmail(),
                request.ownerPassword(),
                List.of(Role.GYM_OWNER),
                null, null, null, null, null,
                request.ownerNationalId(),
                null, false, null
        ));

        return toResponse(org);
    }

    public List<OrganizationResponse> findAll() {
        return organizationRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<OrganizationResponse> findActiveOrganizations() {
        return organizationRepository.findByActiveTrue().stream()
                .filter(org -> !SystemAccounts.isBootstrapOrganization(org))
                .filter(org -> org.getSubscriptionStatus() == SubscriptionStatus.ACTIVE
                        || org.getSubscriptionStatus() == SubscriptionStatus.TRIAL)
                .map(this::toResponse)
                .toList();
    }

    public OrganizationResponse findById(Long id) {
        return toResponse(getById(id));
    }

    @Transactional
    public OrganizationResponse update(Long id, OrganizationRequest request) {
        Organization org = getById(id);

        if (request.slug() != null && !request.slug().equals(org.getSlug())) {
            organizationRepository.findBySlug(request.slug())
                    .filter(existing -> !existing.getId().equals(id))
                    .ifPresent(existing -> {
                        throw new BusinessException("El slug ya está en uso");
                    });
            org.setSlug(request.slug());
        }
        if (request.name() != null) {
            org.setName(request.name());
        }
        org.setContactEmail(resolveContactEmail(request));
        if (request.contactPhone() != null) {
            org.setContactPhone(request.contactPhone());
        }
        if (request.subscriptionStatus() != null) {
            org.setSubscriptionStatus(request.subscriptionStatus());
        }

        org = organizationRepository.save(org);
        userService.syncGymOwner(
                org.getId(),
                request.ownerFirstName(),
                request.ownerLastName(),
                request.ownerEmail(),
                request.ownerPassword()
        );

        return toResponse(org);
    }

    public GymOrganizationResponse getGymProfile(Long organizationId) {
        return toGymResponse(getById(organizationId));
    }

    @Transactional
    public GymOrganizationResponse updateGymProfile(Long organizationId, Long userId, GymOrganizationUpdateRequest request) {
        User actor = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        if (!actor.hasRole(Role.GYM_OWNER)) {
            throw new BusinessException("Solo el administrador del gimnasio puede editar el perfil");
        }
        if (actor.getOrganization() == null || !actor.getOrganization().getId().equals(organizationId)) {
            throw new BusinessException("No perteneces a este gimnasio");
        }
        if (!passwordEncoder.matches(request.currentPassword(), actor.getPasswordHash())) {
            throw new BusinessException("Contraseña incorrecta");
        }

        Organization org = getById(organizationId);
        org.setName(request.name().trim());
        if (request.contactEmail() != null) {
            org.setContactEmail(blankToNull(request.contactEmail()));
        }
        if (request.contactPhone() != null) {
            org.setContactPhone(blankToNull(request.contactPhone()));
        }
        org.setAddress(blankToNull(request.address()));
        org.setCity(blankToNull(request.city()));
        org.setTagline(blankToNull(request.tagline()));
        org.setBusinessHours(blankToNull(request.businessHours()));
        org.setWebsiteUrl(blankToNull(request.websiteUrl()));
        org.setSocialHandle(blankToNull(request.socialHandle()));
        if (request.accentId() != null && !request.accentId().isBlank()) {
            String accent = request.accentId().trim().toLowerCase();
            if (!ALLOWED_ACCENTS.contains(accent)) {
                throw new BusinessException("Color de marca no válido");
            }
            org.setAccentId(accent);
        }
        return toGymResponse(organizationRepository.save(org));
    }

    @Transactional
    public String updateSeasonTheme(Long organizationId, String seasonThemeRaw) {
        Organization org = getById(organizationId);
        String normalized = seasonThemeRaw == null ? "NONE" : seasonThemeRaw.trim().toUpperCase();
        try {
            com.gymplatform.domain.enums.SeasonTheme.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            throw new BusinessException("Tema estacional no válido");
        }
        org.setSeasonTheme(normalized);
        organizationRepository.save(org);
        return normalized;
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private GymOrganizationResponse toGymResponse(Organization org) {
        String accent = org.getAccentId() != null && !org.getAccentId().isBlank()
                ? org.getAccentId()
                : "indigo";
        String season = org.getSeasonTheme() != null && !org.getSeasonTheme().isBlank()
                ? org.getSeasonTheme()
                : "NONE";
        return new GymOrganizationResponse(
                org.getId(),
                org.getName(),
                org.getSlug(),
                org.getContactEmail(),
                org.getContactPhone(),
                org.getAddress(),
                org.getCity(),
                org.getTagline(),
                org.getBusinessHours(),
                org.getWebsiteUrl(),
                org.getSocialHandle(),
                accent,
                season
        );
    }

    private Organization getById(Long id) {
        return organizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));
    }

    private String resolveContactEmail(OrganizationRequest request) {
        if (request.contactEmail() != null && !request.contactEmail().isBlank()) {
            return request.contactEmail();
        }
        return request.ownerEmail();
    }

    private OrganizationResponse toResponse(Organization org) {
        User owner = userService.findGymOwner(org.getId()).orElse(null);
        return new OrganizationResponse(
                org.getId(), org.getName(), org.getSlug(),
                org.getContactEmail(), org.getContactPhone(),
                org.getSubscriptionStatus(), org.isActive(),
                org.getCreatedAt(),
                owner != null ? owner.getFirstName() : null,
                owner != null ? owner.getLastName() : null,
                owner != null ? owner.getEmail() : null
        );
    }
}
