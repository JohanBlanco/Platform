package com.gymplatform.service;

import com.gymplatform.config.SystemAccounts;
import com.gymplatform.domain.entity.MemberProfile;
import com.gymplatform.domain.entity.Organization;
import com.gymplatform.domain.entity.User;
import com.gymplatform.domain.enums.MemberMembershipStatus;
import com.gymplatform.domain.enums.Role;
import com.gymplatform.dto.GuestWhatsappMessagesRequest;
import com.gymplatform.dto.MemberMembershipInfo;
import com.gymplatform.dto.MemberProfileUpdateRequest;
import com.gymplatform.dto.InstructorOptionResponse;
import com.gymplatform.dto.UserCreateRequest;
import com.gymplatform.dto.UserCreateResponse;
import com.gymplatform.dto.UserResponse;
import com.gymplatform.dto.UserWhatsappMessagesRequest;
import com.gymplatform.dto.WhatsappBulkMessagesOutboundResponse;
import com.gymplatform.dto.WhatsappMessagesOutboundResponse;
import com.gymplatform.dto.WhatsappOutboundResponse;
import com.gymplatform.exception.BusinessException;
import com.gymplatform.exception.ResourceNotFoundException;
import com.gymplatform.repository.MemberProfileRepository;
import com.gymplatform.repository.OrganizationRepository;
import com.gymplatform.repository.UserRepository;
import com.gymplatform.util.PasswordHelper;
import com.gymplatform.util.NationalIdHelper;
import com.gymplatform.util.RoleUtils;
import com.gymplatform.util.WhatsAppPhoneHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;
import java.util.Set;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final MemberProfileRepository memberProfileRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;
    private final MemberSubscriptionService memberSubscriptionService;
    private final CustomFormService customFormService;
    private final BroadcastSettingsService broadcastSettingsService;

    public UserService(UserRepository userRepository, MemberProfileRepository memberProfileRepository,
                       OrganizationRepository organizationRepository, PasswordEncoder passwordEncoder,
                       MemberSubscriptionService memberSubscriptionService,
                       CustomFormService customFormService,
                       BroadcastSettingsService broadcastSettingsService) {
        this.userRepository = userRepository;
        this.memberProfileRepository = memberProfileRepository;
        this.organizationRepository = organizationRepository;
        this.passwordEncoder = passwordEncoder;
        this.memberSubscriptionService = memberSubscriptionService;
        this.customFormService = customFormService;
        this.broadcastSettingsService = broadcastSettingsService;
    }

    @Transactional
    public UserCreateResponse createStaff(Long organizationId, UserCreateRequest request) {
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));

        Set<Role> roles = RoleUtils.normalizeGymRoles(request.roles());
        validateMemberRequirements(roles, request);

        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException("El correo ya está registrado");
        }

        User user = new User();
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(PasswordHelper.resolve(request.password())));
        user.setRoles(roles);
        user.setOrganization(org);
        applyNationalId(user, null, request.nationalId());
        if (request.whatsappPhone() != null && !request.whatsappPhone().isBlank()) {
            user.setWhatsappPhone(WhatsAppPhoneHelper.normalizeCostaRicaLocal(request.whatsappPhone()));
        }

        user = userRepository.save(user);
        ensureMemberProfile(user, request);
        assignMembershipIfRequested(organizationId, user, request);
        WhatsappMessagesOutboundResponse outbound = maybePrepareMemberWhatsapp(organizationId, roles, request, user);
        return UserCreateResponse.of(toUserResponse(user), outbound);
    }

    private WhatsappMessagesOutboundResponse maybePrepareMemberWhatsapp(
            Long organizationId,
            Set<Role> roles,
            UserCreateRequest request,
            User user) {
        if (!roles.contains(Role.MEMBER)) {
            return null;
        }
        boolean sendForm = Boolean.TRUE.equals(request.sendRegistrationForm());
        List<Long> templateIds = request.broadcastTemplateIds() != null
                ? request.broadcastTemplateIds()
                : List.of();
        if (!sendForm && templateIds.isEmpty()) {
            return null;
        }
        if (user.getWhatsappPhone() == null || user.getWhatsappPhone().isBlank()) {
            return null;
        }
        if (!broadcastSettingsService.isWhatsAppEnabled(organizationId)) {
            return null;
        }
        String registrationMessage = sendForm
                ? customFormService.composeRegistrationFormMessage(organizationId, user)
                : null;
        return broadcastSettingsService.prepareMemberWhatsappMessages(
                organizationId, user, sendForm, templateIds, registrationMessage);
    }

    @Transactional
    public WhatsappMessagesOutboundResponse sendWhatsappMessages(
            Long organizationId,
            Long userId,
            UserWhatsappMessagesRequest request) {
        User user = requireStaffUser(organizationId, userId);
        if (!user.hasRole(Role.MEMBER)) {
            throw new BusinessException("Solo se pueden enviar mensajes de WhatsApp a miembros");
        }
        boolean sendForm = Boolean.TRUE.equals(request.sendRegistrationForm());
        List<Long> templateIds = request.templateIds() != null ? request.templateIds() : List.of();
        if (!sendForm && templateIds.isEmpty()) {
            throw new BusinessException("Selecciona al menos un mensaje para enviar");
        }
        String registrationMessage = sendForm
                ? customFormService.composeRegistrationFormMessage(organizationId, user)
                : null;
        return broadcastSettingsService.prepareMemberWhatsappMessages(
                organizationId, user, sendForm, templateIds, registrationMessage);
    }

    /**
     * Envía formulario / plantillas a un número de WhatsApp que aún no es usuario del gym
     * (p. ej. persona por inscribir).
     */
    @Transactional
    public WhatsappMessagesOutboundResponse sendWhatsappMessagesToPhone(
            Long organizationId,
            GuestWhatsappMessagesRequest request) {
        boolean sendForm = Boolean.TRUE.equals(request.sendRegistrationForm());
        List<Long> templateIds = request.templateIds() != null ? request.templateIds() : List.of();
        if (!sendForm && templateIds.isEmpty()) {
            throw new BusinessException("Selecciona al menos un mensaje para enviar");
        }
        String phone = WhatsAppPhoneHelper.normalizeCostaRicaLocal(request.whatsappPhone());
        String firstName = request.firstName() != null ? request.firstName().trim() : "";
        String registrationMessage = sendForm
                ? customFormService.composeGuestRegistrationFormMessage(organizationId, firstName)
                : null;
        return broadcastSettingsService.prepareGuestWhatsappMessages(
                organizationId, phone, firstName, sendForm, templateIds, registrationMessage);
    }

    /**
     * Envía los mensajes seleccionados a todos los usuarios activos del gimnasio con WhatsApp.
     * Requiere Cloud API (no wa.me).
     */
    @Transactional
    public WhatsappBulkMessagesOutboundResponse sendWhatsappMessagesToAllWithPhone(
            Long organizationId,
            UserWhatsappMessagesRequest request) {
        boolean sendForm = Boolean.TRUE.equals(request.sendRegistrationForm());
        List<Long> templateIds = request.templateIds() != null ? request.templateIds() : List.of();
        if (!sendForm && templateIds.isEmpty()) {
            throw new BusinessException("Selecciona al menos un mensaje para enviar");
        }
        if (!broadcastSettingsService.isWhatsAppEnabled(organizationId)) {
            throw new BusinessException(
                    "Activa WhatsApp en Configuración → Mensajes de difusión para enviar mensajes");
        }
        if (!broadcastSettingsService.isCloudApiDelivery(organizationId)) {
            throw new BusinessException(
                    "El envío a todos requiere WhatsApp Cloud API. "
                            + "Actívalo en Configuración → Mensajes de difusión, o envía a un usuario a la vez.");
        }

        List<User> recipients = userRepository.findByOrganizationId(organizationId).stream()
                .filter(User::isActive)
                .filter(u -> !SystemAccounts.isBootstrapUser(u))
                .filter(u -> u.getWhatsappPhone() != null && !u.getWhatsappPhone().isBlank())
                .toList();
        if (recipients.isEmpty()) {
            throw new BusinessException("No hay usuarios activos con número de WhatsApp");
        }

        int sent = 0;
        int failed = 0;
        List<String> errors = new java.util.ArrayList<>();
        for (User user : recipients) {
            try {
                String registrationMessage = sendForm
                        ? customFormService.composeRegistrationFormMessage(organizationId, user)
                        : null;
                broadcastSettingsService.prepareMemberWhatsappMessages(
                        organizationId, user, sendForm, templateIds, registrationMessage);
                sent++;
            } catch (Exception ex) {
                failed++;
                if (errors.size() < 8) {
                    String name = (user.getFirstName() + " " + user.getLastName()).trim();
                    String detail = ex.getMessage() != null ? ex.getMessage() : "error al enviar";
                    errors.add(name + ": " + detail);
                }
            }
        }

        return new WhatsappBulkMessagesOutboundResponse(
                recipients.size(), sent, failed, "CLOUD_API", errors);
    }

    @Transactional(readOnly = true)
    public WhatsappOutboundResponse resendRegistrationForm(Long organizationId, Long userId) {
        User user = requireStaffUser(organizationId, userId);
        if (!user.hasRole(Role.MEMBER)) {
            throw new BusinessException("Solo se puede reenviar el formulario de registro a miembros");
        }
        return customFormService.resendRegistrationFormViaWhatsApp(organizationId, user);
    }

    @Transactional
    public UserResponse updateStaff(Long organizationId, Long userId, UserCreateRequest request) {
        User user = requireStaffUser(organizationId, userId);
        Set<Role> roles = RoleUtils.normalizeGymRoles(request.roles());
        validateMemberRequirements(roles, request);

        if (!request.email().equals(user.getEmail()) && userRepository.existsByEmail(request.email())) {
            throw new BusinessException("El correo ya está registrado");
        }

        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setEmail(request.email());
        user.setRoles(roles);
        applyNationalId(user, user.getId(), request.nationalId());
        if (request.whatsappPhone() != null && !request.whatsappPhone().isBlank()) {
            user.setWhatsappPhone(WhatsAppPhoneHelper.normalizeCostaRicaLocal(request.whatsappPhone()));
        }

        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(PasswordHelper.resolve(request.password())));
        }

        user = userRepository.save(user);
        ensureMemberProfile(user, request);
        assignMembershipIfRequested(organizationId, user, request);
        return toUserResponse(user);
    }

    private void assignMembershipIfRequested(Long organizationId, User user, UserCreateRequest request) {
        if (request.membershipPackageId() != null && user.hasRole(Role.MEMBER)) {
            memberSubscriptionService.assignMembership(organizationId, user.getId(), request.membershipPackageId());
        }
    }

    private void validateMemberRequirements(Set<Role> roles, UserCreateRequest request) {
        if (!roles.contains(Role.MEMBER)) {
            return;
        }
        if (request.membershipPackageId() == null) {
            throw new BusinessException("Debe seleccionar una membresía para el miembro");
        }
    }

    private void ensureMemberProfile(User user, UserCreateRequest request) {
        if (!user.hasRole(Role.MEMBER)) {
            return;
        }

        MemberProfile profile = memberProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    MemberProfile p = new MemberProfile();
                    p.setUser(user);
                    return p;
                });
        profile.setNationalId(user.getNationalId());
        if (request.birthYear() != null) profile.setBirthYear(request.birthYear());
        if (request.age() != null) profile.setAge(request.age());
        if (request.goals() != null) profile.setGoals(request.goals());
        if (request.phone() != null) profile.setPhone(request.phone());
        profile.setUpdatedAt(Instant.now());
        memberProfileRepository.save(profile);
    }

    private void applyNationalId(User user, Long userId, String rawNationalId) {
        if (rawNationalId == null || rawNationalId.isBlank()) {
            throw new BusinessException("La cédula es obligatoria");
        }
        String normalized = NationalIdHelper.normalize(rawNationalId);
        if (!NationalIdHelper.isValid(normalized)) {
            throw new BusinessException("La cédula debe tener 9 dígitos numéricos");
        }
        if (userRepository.existsByNationalIdExcluding(normalized, userId)) {
            throw new BusinessException("Ya existe un usuario con esa cédula");
        }
        user.setNationalId(normalized);
    }

    private User requireStaffUser(Long organizationId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        if (user.getOrganization() == null || !user.getOrganization().getId().equals(organizationId)) {
            throw new BusinessException("El usuario no pertenece a este gimnasio");
        }
        if (RoleUtils.isPlatformUser(user.getRoles())) {
            throw new BusinessException("No se puede editar este usuario");
        }
        if (SystemAccounts.isBootstrapUser(user)) {
            throw new BusinessException("No se puede editar este usuario");
        }
        return user;
    }

    public java.util.Optional<User> findGymOwner(Long organizationId) {
        return userRepository.findByOrganizationIdAndRole(organizationId, Role.GYM_OWNER).stream()
                .filter(u -> !SystemAccounts.isBootstrapUser(u))
                .findFirst();
    }

    @Transactional
    public void syncGymOwner(Long organizationId, String firstName, String lastName, String email, String password) {
        var owners = userRepository.findByOrganizationIdAndRole(organizationId, Role.GYM_OWNER).stream()
                .filter(u -> !SystemAccounts.isBootstrapUser(u))
                .toList();
        User owner = owners.isEmpty() ? null : owners.get(0);

        if (owner == null) {
            Organization org = organizationRepository.findById(organizationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));
            createStaff(organizationId, new UserCreateRequest(
                    firstName != null && !firstName.isBlank() ? firstName : "Administrador",
                    lastName != null && !lastName.isBlank() ? lastName : org.getName(),
                    email,
                    password,
                    List.of(Role.GYM_OWNER),
                    null, null, null, null, null,
                    String.format("8%08d", organizationId % 100_000_000L),
                    null, false, null
            ));
            return;
        }

        if (firstName != null && !firstName.isBlank()) {
            owner.setFirstName(firstName);
        }
        if (lastName != null && !lastName.isBlank()) {
            owner.setLastName(lastName);
        }
        if (email != null && !email.equals(owner.getEmail())) {
            if (userRepository.existsByEmail(email)) {
                throw new BusinessException("El correo ya está registrado");
            }
            owner.setEmail(email);
        }
        if (password != null && !password.isBlank()) {
            owner.setPasswordHash(passwordEncoder.encode(PasswordHelper.resolve(password)));
        }
        if (!owner.hasRole(Role.GYM_OWNER)) {
            owner.getRoles().add(Role.GYM_OWNER);
        }
        userRepository.save(owner);
    }

    public List<UserResponse> findByOrganization(Long organizationId) {
        return userRepository.findByOrganizationId(organizationId).stream()
                .filter(u -> !SystemAccounts.isBootstrapUser(u))
                .map(this::toUserResponse)
                .toList();
    }

    /** Instructores/admins activos del gym (lista segura para miembros). */
    public List<InstructorOptionResponse> findInstructors(Long organizationId) {
        return userRepository.findByOrganizationId(organizationId).stream()
                .filter(User::isActive)
                .filter(u -> !SystemAccounts.isBootstrapUser(u))
                .filter(u -> u.hasRole(Role.INSTRUCTOR) || u.hasRole(Role.GYM_OWNER))
                .sorted(java.util.Comparator
                        .comparing(User::getFirstName, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(User::getLastName, String.CASE_INSENSITIVE_ORDER))
                .map(u -> new InstructorOptionResponse(u.getId(), u.getFirstName(), u.getLastName()))
                .toList();
    }

    public List<UserResponse> findPendingMembershipPayment(Long organizationId) {
        return userRepository.findByOrganizationIdAndRole(organizationId, Role.MEMBER).stream()
                .filter(u -> !SystemAccounts.isBootstrapUser(u))
                .filter(u -> memberSubscriptionService.getMembershipInfo(u.getId()).status()
                        == MemberMembershipStatus.PAYMENT_PENDING)
                .map(this::toUserResponse)
                .sorted(java.util.Comparator.comparing(
                        u -> u.nextPaymentDate() != null ? u.nextPaymentDate() : java.time.LocalDate.MIN))
                .toList();
    }

    public UserResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        return toUserResponse(user);
    }

    @Transactional
    public UserResponse updateProfile(Long userId, MemberProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        MemberProfile profile = memberProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    MemberProfile p = new MemberProfile();
                    p.setUser(user);
                    return p;
                });

        if (request.birthYear() != null) profile.setBirthYear(request.birthYear());
        if (request.age() != null) profile.setAge(request.age());
        if (request.goals() != null) profile.setGoals(request.goals());
        if (request.phone() != null) profile.setPhone(request.phone());
        if (request.emergencyContact() != null) profile.setEmergencyContact(request.emergencyContact());
        if (request.nationalId() != null) {
            applyNationalId(user, userId, request.nationalId());
            profile.setNationalId(user.getNationalId());
        }
        profile.setUpdatedAt(Instant.now());

        profile = memberProfileRepository.save(profile);
        return toUserResponse(user);
    }

    private UserResponse toUserResponse(User user) {
        MemberProfile profile = memberProfileRepository.findByUserId(user.getId()).orElse(null);
        MemberMembershipInfo membershipInfo = user.hasRole(Role.MEMBER)
                ? memberSubscriptionService.getMembershipInfo(user.getId())
                : null;
        return UserMapper.toResponse(user, profile, membershipInfo);
    }
}
