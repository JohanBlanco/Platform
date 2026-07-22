package com.gymplatform.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gymplatform.config.SystemAccounts;
import com.gymplatform.domain.entity.CustomForm;
import com.gymplatform.domain.entity.CustomFormSubmission;
import com.gymplatform.domain.entity.Organization;
import com.gymplatform.domain.entity.User;
import com.gymplatform.domain.enums.Role;
import com.gymplatform.dto.FormFieldDto;
import com.gymplatform.dto.MemberFileDetailResponse;
import com.gymplatform.dto.MemberFileSummaryResponse;
import com.gymplatform.dto.MemberFileUserResponse;
import com.gymplatform.exception.BusinessException;
import com.gymplatform.exception.ResourceNotFoundException;
import com.gymplatform.repository.CustomFormSubmissionRepository;
import com.gymplatform.repository.UserRepository;
import com.gymplatform.util.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class MemberFileService {

    private final CustomFormSubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public MemberFileService(
            CustomFormSubmissionRepository submissionRepository,
            UserRepository userRepository,
            ObjectMapper objectMapper) {
        this.submissionRepository = submissionRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<MemberFileUserResponse> listMemberFiles(Long organizationId) {
        requireReceptionRole();
        List<CustomFormSubmission> submissions = submissionRepository
                .findBySubmittedBy_Organization_IdAndSubmittedByIsNotNullOrderByCreatedAtDesc(organizationId);

        Map<Long, MemberFileUserResponseBuilder> grouped = new LinkedHashMap<>();
        for (CustomFormSubmission submission : submissions) {
            User member = submission.getSubmittedBy();
            if (member == null || SystemAccounts.isBootstrapUser(member)) {
                continue;
            }
            grouped.computeIfAbsent(member.getId(), id -> new MemberFileUserResponseBuilder(member))
                    .addFile(toSummary(submission));
        }
        return grouped.values().stream().map(MemberFileUserResponseBuilder::build).toList();
    }

    @Transactional(readOnly = true)
    public MemberFileUserResponse getMemberFilesForUser(Long organizationId, Long userId) {
        requireReceptionRole();
        User member = requireMember(organizationId, userId);
        List<MemberFileSummaryResponse> files = submissionRepository
                .findBySubmittedBy_IdAndSubmittedBy_Organization_IdOrderByCreatedAtDesc(userId, organizationId)
                .stream()
                .map(this::toSummary)
                .toList();
        return new MemberFileUserResponse(
                member.getId(),
                member.getFirstName(),
                member.getLastName(),
                member.getEmail(),
                files.size(),
                files
        );
    }

    @Transactional(readOnly = true)
    public MemberFileDetailResponse getMemberFileDetail(Long organizationId, Long userId, Long submissionId) {
        requireReceptionRole();
        requireMember(organizationId, userId);
        CustomFormSubmission submission = submissionRepository
                .findByIdAndSubmittedBy_IdAndSubmittedBy_Organization_Id(submissionId, userId, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Archivo no encontrado"));

        CustomForm form = submission.getForm();
        Organization org = form.getOrganization();
        User member = submission.getSubmittedBy();

        return new MemberFileDetailResponse(
                submission.getId(),
                member.getId(),
                member.getFirstName() + " " + member.getLastName(),
                member.getEmail(),
                form.getId(),
                form.getTitle(),
                form.getDescription(),
                org.getName(),
                readFields(form.getFieldsJson()),
                readAnswerMap(submission.getAnswersJson()),
                submission.getCreatedAt()
        );
    }

    public User resolveLinkedMember(Long organizationId, Long memberUserId) {
        if (memberUserId == null) {
            return null;
        }
        User user = userRepository.findById(memberUserId)
                .orElseThrow(() -> new BusinessException("El enlace del formulario no es válido"));
        if (user.getOrganization() == null || !user.getOrganization().getId().equals(organizationId)) {
            throw new BusinessException("El enlace del formulario no es válido");
        }
        if (!user.getRoles().contains(Role.MEMBER)) {
            throw new BusinessException("El enlace del formulario no es válido");
        }
        return user;
    }

    private User requireMember(Long organizationId, Long userId) {
        User user = userRepository.findById(userId)
                .filter(item -> item.getOrganization() != null && item.getOrganization().getId().equals(organizationId))
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        if (!user.getRoles().contains(Role.MEMBER)) {
            throw new BusinessException("Solo los miembros tienen expedientes de formularios");
        }
        return user;
    }

    private MemberFileSummaryResponse toSummary(CustomFormSubmission submission) {
        CustomForm form = submission.getForm();
        return new MemberFileSummaryResponse(
                submission.getId(),
                form.getId(),
                form.getTitle(),
                form.getSlug(),
                submission.getCreatedAt()
        );
    }

    private List<FormFieldDto> readFields(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<List<FormFieldDto>>() {});
        } catch (JsonProcessingException e) {
            throw new BusinessException("No se pudieron leer los campos del formulario");
        }
    }

    private Map<String, Object> readAnswerMap(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            throw new BusinessException("No se pudieron leer las respuestas");
        }
    }

    private void requireReceptionRole() {
        var user = SecurityUtils.currentUser();
        if (!user.hasRole("GYM_OWNER") && !user.hasRole("RECEPTIONIST")) {
            throw new BusinessException("No tienes permiso para ver expedientes");
        }
    }

    private static final class MemberFileUserResponseBuilder {
        private final User member;
        private final List<MemberFileSummaryResponse> files = new ArrayList<>();

        private MemberFileUserResponseBuilder(User member) {
            this.member = member;
        }

        private void addFile(MemberFileSummaryResponse file) {
            files.add(file);
        }

        private MemberFileUserResponse build() {
            return new MemberFileUserResponse(
                    member.getId(),
                    member.getFirstName(),
                    member.getLastName(),
                    member.getEmail(),
                    files.size(),
                    List.copyOf(files)
            );
        }
    }
}
