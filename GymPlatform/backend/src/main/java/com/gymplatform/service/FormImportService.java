package com.gymplatform.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gymplatform.domain.entity.CustomFormSubmission;
import com.gymplatform.domain.entity.MemberProfile;
import com.gymplatform.domain.entity.User;
import com.gymplatform.domain.enums.FormImportMatchField;
import com.gymplatform.domain.enums.FormImportMode;
import com.gymplatform.domain.enums.FormImportTargetModel;
import com.gymplatform.domain.enums.Role;
import com.gymplatform.dto.*;
import com.gymplatform.exception.BusinessException;
import com.gymplatform.repository.CustomFormSubmissionRepository;
import com.gymplatform.repository.MemberProfileRepository;
import com.gymplatform.repository.UserRepository;
import com.gymplatform.util.NationalIdHelper;
import com.gymplatform.util.PasswordHelper;
import com.gymplatform.util.SecurityUtils;
import com.gymplatform.util.WhatsAppPhoneHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.*;

@Service
public class FormImportService {

    private static final Set<String> USER_FIELDS = Set.of(
            "firstName", "lastName", "email", "whatsappPhone");
    private static final Set<String> PROFILE_FIELDS = Set.of(
            "nationalId", "phone", "goals", "birthYear", "age");

    private final CustomFormSubmissionRepository submissionRepository;
    private final FormFolderService folderService;
    private final UserRepository userRepository;
    private final MemberProfileRepository memberProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    public FormImportService(
            CustomFormSubmissionRepository submissionRepository,
            FormFolderService folderService,
            UserRepository userRepository,
            MemberProfileRepository memberProfileRepository,
            PasswordEncoder passwordEncoder,
            ObjectMapper objectMapper) {
        this.submissionRepository = submissionRepository;
        this.folderService = folderService;
        this.userRepository = userRepository;
        this.memberProfileRepository = memberProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.objectMapper = objectMapper;
    }

    public List<FormImportModelResponse> listModels() {
        requireConfigRole();
        return List.of(new FormImportModelResponse(
                FormImportTargetModel.USER,
                "Usuarios",
                "Crea o actualiza miembros del gimnasio a partir de respuestas.",
                List.of(
                        field("firstName", "Nombre", true),
                        field("lastName", "Apellido", true),
                        field("email", "Correo", true),
                        field("whatsappPhone", "WhatsApp", false),
                        field("nationalId", "Cédula", false),
                        field("phone", "Teléfono (perfil)", false),
                        field("goals", "Metas", false),
                        field("birthYear", "Año de nacimiento", false),
                        field("age", "Edad", false)
                ),
                List.of(FormImportMatchField.EMAIL, FormImportMatchField.NATIONAL_ID, FormImportMatchField.WHATSAPP)
        ));
    }

    public FormImportPreviewResponse preview(Long organizationId, FormImportRequest request) {
        requireConfigRole();
        validateRequest(request);
        folderService.requireFolder(organizationId, request.responseFolderId(),
                com.gymplatform.domain.enums.FormFolderKind.RESPONSE);
        List<CustomFormSubmission> submissions = submissionRepository
                .findByResponseFolderIdOrderByCreatedAtDesc(request.responseFolderId());
        List<FormImportPreviewRow> rows = new ArrayList<>();
        int ready = 0;
        int skipped = 0;
        int errors = 0;
        for (CustomFormSubmission submission : submissions) {
            RowResult result = evaluateRow(organizationId, submission, request, false);
            rows.add(result.row());
            switch (result.row().status()) {
                case "READY" -> ready++;
                case "SKIP" -> skipped++;
                default -> errors++;
            }
        }
        return new FormImportPreviewResponse(submissions.size(), ready, skipped, errors, rows);
    }

    @Transactional
    public FormImportResultResponse execute(Long organizationId, FormImportRequest request) {
        requireConfigRole();
        validateRequest(request);
        folderService.requireFolder(organizationId, request.responseFolderId(),
                com.gymplatform.domain.enums.FormFolderKind.RESPONSE);
        List<CustomFormSubmission> submissions = submissionRepository
                .findByResponseFolderIdOrderByCreatedAtDesc(request.responseFolderId());
        int created = 0;
        int updated = 0;
        int skipped = 0;
        int errors = 0;
        for (CustomFormSubmission submission : submissions) {
            RowResult result = evaluateRow(organizationId, submission, request, true);
            if ("CREATED".equals(result.row().status())) {
                created++;
            } else if ("UPDATED".equals(result.row().status())) {
                updated++;
            } else if ("SKIP".equals(result.row().status())) {
                skipped++;
            } else {
                errors++;
            }
        }
        return new FormImportResultResponse(created, updated, skipped, errors);
    }

    private RowResult evaluateRow(
            Long organizationId,
            CustomFormSubmission submission,
            FormImportRequest request,
            boolean persist) {
        if (request.targetModel() != FormImportTargetModel.USER) {
            return rowResult(submission, request.mode(), "ERROR", "Modelo no soportado", null, Map.of());
        }
        if (submission.getImportedAt() != null && request.mode() == FormImportMode.CREATE) {
            return rowResult(submission, request.mode(), "SKIP", "Ya importada anteriormente", null, Map.of());
        }
        try {
            Map<String, Object> answers = readAnswers(submission.getAnswersJson());
            Map<String, String> extracted = extractMappedValues(answers, request.mappings());
            if (request.mode() == FormImportMode.CREATE) {
                return handleCreate(organizationId, submission, extracted, persist);
            }
            return handleUpdate(organizationId, submission, extracted, request.matchField(), persist);
        } catch (BusinessException ex) {
            return rowResult(submission, request.mode(), "ERROR", ex.getMessage(), null, Map.of());
        }
    }

    private RowResult handleCreate(
            Long organizationId,
            CustomFormSubmission submission,
            Map<String, String> extracted,
            boolean persist) {
        String email = value(extracted, "email");
        String firstName = value(extracted, "firstName");
        String lastName = value(extracted, "lastName");
        if (email == null || firstName == null || lastName == null) {
            return rowResult(submission, FormImportMode.CREATE, "ERROR",
                    "Faltan nombre, apellido o correo en el mapeo", null, extracted);
        }
        if (userRepository.existsByEmail(email)) {
            return rowResult(submission, FormImportMode.CREATE, "SKIP",
                    "Ya existe un usuario con ese correo", null, extracted);
        }
        if (!persist) {
            return rowResult(submission, FormImportMode.CREATE, "READY",
                    "Se creará un nuevo usuario", null, extracted);
        }
        User user = new User();
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(PasswordHelper.resolve(null)));
        user.setRoles(Set.of(Role.MEMBER));
        user.setOrganization(submission.getForm().getOrganization());
        applyWhatsapp(user, extracted.get("whatsappPhone"));
        user = userRepository.save(user);
        applyProfile(user, extracted);
        submission.setImportedAt(Instant.now());
        submissionRepository.save(submission);
        return rowResult(submission, FormImportMode.CREATE, "CREATED",
                "Usuario creado", user.getId(), extracted);
    }

    private RowResult handleUpdate(
            Long organizationId,
            CustomFormSubmission submission,
            Map<String, String> extracted,
            FormImportMatchField matchField,
            boolean persist) {
        if (matchField == null) {
            throw new BusinessException("Selecciona un identificador único para actualizar registros");
        }
        Optional<User> matched = findMatchedUser(organizationId, extracted, matchField);
        if (matched.isEmpty()) {
            return rowResult(submission, FormImportMode.UPDATE, "ERROR",
                    "No se encontró un usuario con el identificador seleccionado", null, extracted);
        }
        User user = matched.get();
        if (!persist) {
            return rowResult(submission, FormImportMode.UPDATE, "READY",
                    "Se actualizará " + user.getEmail(), user.getId(), extracted);
        }
        if (extracted.containsKey("firstName")) user.setFirstName(extracted.get("firstName"));
        if (extracted.containsKey("lastName")) user.setLastName(extracted.get("lastName"));
        if (extracted.containsKey("email")) user.setEmail(extracted.get("email"));
        if (extracted.containsKey("whatsappPhone")) applyWhatsapp(user, extracted.get("whatsappPhone"));
        userRepository.save(user);
        applyProfile(user, extracted);
        submission.setImportedAt(Instant.now());
        submissionRepository.save(submission);
        return rowResult(submission, FormImportMode.UPDATE, "UPDATED",
                "Usuario actualizado", user.getId(), extracted);
    }

    private Optional<User> findMatchedUser(
            Long organizationId,
            Map<String, String> extracted,
            FormImportMatchField matchField) {
        return switch (matchField) {
            case EMAIL -> {
                String email = value(extracted, "email");
                if (email == null) yield Optional.empty();
                yield userRepository.findByEmail(email)
                        .filter(user -> user.getOrganization() != null
                                && organizationId.equals(user.getOrganization().getId()));
            }
            case NATIONAL_ID -> {
                String nationalId = normalizeNationalId(extracted.get("nationalId"));
                if (nationalId == null) yield Optional.empty();
                yield memberProfileRepository.findByNationalIdInOrganization(nationalId, organizationId)
                        .map(MemberProfile::getUser);
            }
            case WHATSAPP -> {
                String phone = normalizeWhatsapp(extracted.get("whatsappPhone"));
                if (phone == null) yield Optional.empty();
                yield userRepository.findByWhatsappPhoneAndOrganizationId(phone, organizationId);
            }
        };
    }

    private void applyProfile(User user, Map<String, String> extracted) {
        if (!hasProfileData(extracted)) return;
        MemberProfile profile = memberProfileRepository.findByUserId(user.getId()).orElseGet(() -> {
            MemberProfile created = new MemberProfile();
            created.setUser(user);
            return created;
        });
        if (extracted.containsKey("nationalId")) {
            profile.setNationalId(normalizeNationalId(extracted.get("nationalId")));
        }
        if (extracted.containsKey("phone")) profile.setPhone(extracted.get("phone"));
        if (extracted.containsKey("goals")) profile.setGoals(extracted.get("goals"));
        if (extracted.containsKey("birthYear")) profile.setBirthYear(parseInteger(extracted.get("birthYear")));
        if (extracted.containsKey("age")) profile.setAge(parseInteger(extracted.get("age")));
        profile.setUpdatedAt(Instant.now());
        memberProfileRepository.save(profile);
    }

    private void applyWhatsapp(User user, String localOrFull) {
        if (localOrFull == null || localOrFull.isBlank()) return;
        user.setWhatsappPhone(normalizeWhatsapp(localOrFull));
    }

    private Map<String, String> extractMappedValues(
            Map<String, Object> answers,
            List<FormImportFieldMappingDto> mappings) {
        Map<String, String> extracted = new LinkedHashMap<>();
        for (FormImportFieldMappingDto mapping : mappings) {
            if (mapping.formFieldId() == null || mapping.targetField() == null) continue;
            Object raw = answers.get(mapping.formFieldId());
            if (raw == null) continue;
            String value = String.valueOf(raw).trim();
            if (!value.isBlank()) {
                extracted.put(mapping.targetField(), value);
            }
        }
        return extracted;
    }

    private void validateRequest(FormImportRequest request) {
        if (request.mode() == FormImportMode.UPDATE && request.matchField() == null) {
            throw new BusinessException("Selecciona un identificador único para actualizar registros");
        }
        for (FormImportFieldMappingDto mapping : request.mappings()) {
            String target = mapping.targetField();
            if (!USER_FIELDS.contains(target) && !PROFILE_FIELDS.contains(target)) {
                throw new BusinessException("Campo de destino no válido: " + target);
            }
        }
        if (request.mode() == FormImportMode.CREATE) {
            boolean hasEmail = request.mappings().stream().anyMatch(m -> "email".equals(m.targetField()));
            boolean hasFirst = request.mappings().stream().anyMatch(m -> "firstName".equals(m.targetField()));
            boolean hasLast = request.mappings().stream().anyMatch(m -> "lastName".equals(m.targetField()));
            if (!hasEmail || !hasFirst || !hasLast) {
                throw new BusinessException("Para crear usuarios mapea nombre, apellido y correo");
            }
        }
    }

    private Map<String, Object> readAnswers(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            throw new BusinessException("No se pudieron leer las respuestas");
        }
    }

    private RowResult rowResult(
            CustomFormSubmission submission,
            FormImportMode mode,
            String status,
            String message,
            Long matchedUserId,
            Map<String, String> previewValues) {
        return new RowResult(new FormImportPreviewRow(
                submission.getId(),
                submission.getForm().getTitle(),
                mode,
                status,
                message,
                matchedUserId,
                previewValues
        ));
    }

    private record RowResult(FormImportPreviewRow row) {}

    private FormImportModelFieldResponse field(String key, String label, boolean requiredForCreate) {
        return new FormImportModelFieldResponse(key, label, requiredForCreate);
    }

    private String value(Map<String, String> extracted, String key) {
        String raw = extracted.get(key);
        return raw == null || raw.isBlank() ? null : raw.trim();
    }

    private boolean hasProfileData(Map<String, String> extracted) {
        return PROFILE_FIELDS.stream().anyMatch(extracted::containsKey);
    }

    private String normalizeNationalId(String value) {
        if (value == null || value.isBlank()) return null;
        String normalized = NationalIdHelper.normalize(value);
        return NationalIdHelper.isValid(normalized) ? normalized : value.trim();
    }

    private String normalizeWhatsapp(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return WhatsAppPhoneHelper.normalizeCostaRicaLocal(value);
        } catch (BusinessException ex) {
            if (value.startsWith("+")) return value.replaceAll("[\\s()-]", "").trim();
            return value.trim();
        }
    }

    private Integer parseInteger(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return Integer.parseInt(value.replaceAll("\\D", ""));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private void requireConfigRole() {
        var user = SecurityUtils.currentUser();
        if (!user.hasRole("GYM_OWNER") && !user.hasRole("RECEPTIONIST")) {
            throw new BusinessException("No tienes permiso para importar datos");
        }
    }
}
