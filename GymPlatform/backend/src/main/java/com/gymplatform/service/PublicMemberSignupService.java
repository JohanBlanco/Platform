package com.gymplatform.service;

import com.gymplatform.domain.entity.MemberProfile;
import com.gymplatform.domain.entity.MembershipPackage;
import com.gymplatform.domain.entity.Organization;
import com.gymplatform.domain.entity.User;
import com.gymplatform.domain.enums.Role;
import com.gymplatform.exception.BusinessException;
import com.gymplatform.exception.ResourceNotFoundException;
import com.gymplatform.repository.MemberProfileRepository;
import com.gymplatform.repository.MembershipPackageRepository;
import com.gymplatform.repository.OrganizationRepository;
import com.gymplatform.repository.UserRepository;
import com.gymplatform.util.MemberSignupFormFactory;
import com.gymplatform.util.NationalIdHelper;
import com.gymplatform.util.PasswordHelper;
import com.gymplatform.util.WhatsAppPhoneHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Set;

@Service
public class PublicMemberSignupService {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final MemberProfileRepository memberProfileRepository;
    private final MembershipPackageRepository packageRepository;
    private final MemberSubscriptionService memberSubscriptionService;
    private final PasswordEncoder passwordEncoder;

    public PublicMemberSignupService(
            OrganizationRepository organizationRepository,
            UserRepository userRepository,
            MemberProfileRepository memberProfileRepository,
            MembershipPackageRepository packageRepository,
            MemberSubscriptionService memberSubscriptionService,
            PasswordEncoder passwordEncoder) {
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
        this.memberProfileRepository = memberProfileRepository;
        this.packageRepository = packageRepository;
        this.memberSubscriptionService = memberSubscriptionService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User createMemberFromAnswers(Long organizationId, Map<String, Object> answers) {
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));

        String firstName = requiredText(answers, MemberSignupFormFactory.FIELD_FIRST_NAME, "nombre");
        String lastName = requiredText(answers, MemberSignupFormFactory.FIELD_LAST_NAME, "apellido");
        String email = requiredText(answers, MemberSignupFormFactory.FIELD_EMAIL, "correo").toLowerCase();
        String nationalIdRaw = requiredText(answers, MemberSignupFormFactory.FIELD_NATIONAL_ID, "cédula");
        String whatsappRaw = requiredText(answers, MemberSignupFormFactory.FIELD_WHATSAPP, "WhatsApp");
        String password = optionalText(answers, MemberSignupFormFactory.FIELD_PASSWORD);
        String membershipRaw = requiredText(answers, MemberSignupFormFactory.FIELD_MEMBERSHIP, "plan de membresía");

        if (userRepository.existsByEmail(email)) {
            throw new BusinessException("Ya existe una cuenta con ese correo. Inicia sesión o usa otro correo.");
        }

        String nationalId = NationalIdHelper.normalize(nationalIdRaw);
        if (!NationalIdHelper.isValid(nationalId)) {
            throw new BusinessException("La cédula debe tener exactamente 9 dígitos numéricos");
        }
        if (userRepository.existsByNationalIdExcluding(nationalId, null)) {
            throw new BusinessException("Ya existe un usuario con esa cédula");
        }

        Long packageId = resolvePackageId(organizationId, membershipRaw);

        User user = new User();
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(PasswordHelper.resolve(password)));
        user.setRoles(Set.of(Role.MEMBER));
        user.setOrganization(org);
        user.setNationalId(nationalId);
        user.setWhatsappPhone(WhatsAppPhoneHelper.normalizeCostaRicaLocal(whatsappRaw));
        user = userRepository.save(user);

        MemberProfile profile = new MemberProfile();
        profile.setUser(user);
        profile.setNationalId(nationalId);
        memberProfileRepository.save(profile);

        memberSubscriptionService.assignMembership(organizationId, user.getId(), packageId);
        return user;
    }

    private Long resolvePackageId(Long organizationId, String raw) {
        String value = raw.trim();
        // Prefer "id:Name" from public form options
        int colon = value.indexOf(':');
        if (colon > 0) {
            String idPart = value.substring(0, colon).trim();
            try {
                Long id = Long.parseLong(idPart);
                MembershipPackage pkg = packageRepository.findById(id)
                        .orElseThrow(() -> new BusinessException("Plan de membresía no válido"));
                if (!pkg.getOrganization().getId().equals(organizationId) || !pkg.isActive()) {
                    throw new BusinessException("Plan de membresía no disponible");
                }
                return id;
            } catch (NumberFormatException ignored) {
                // fall through to name match
            }
        }
        return packageRepository.findByOrganizationIdAndActiveTrue(organizationId).stream()
                .filter(p -> p.getName().equalsIgnoreCase(value))
                .map(MembershipPackage::getId)
                .findFirst()
                .orElseThrow(() -> new BusinessException("Selecciona un plan de membresía válido"));
    }

    private static String requiredText(Map<String, Object> answers, String key, String label) {
        String value = optionalText(answers, key);
        if (value == null || value.isBlank()) {
            throw new BusinessException("El campo " + label + " es obligatorio");
        }
        return value.trim();
    }

    private static String optionalText(Map<String, Object> answers, String key) {
        Object raw = answers.get(key);
        if (raw == null) {
            return null;
        }
        String value = String.valueOf(raw).trim();
        return value.isEmpty() ? null : value;
    }
}
