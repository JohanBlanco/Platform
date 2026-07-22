package com.gymplatform.service;

import com.gymplatform.domain.entity.BodyMeasurement;
import com.gymplatform.domain.entity.Organization;
import com.gymplatform.domain.entity.User;
import com.gymplatform.domain.enums.Role;
import com.gymplatform.dto.*;
import com.gymplatform.exception.BusinessException;
import com.gymplatform.exception.ResourceNotFoundException;
import com.gymplatform.repository.BodyMeasurementRepository;
import com.gymplatform.repository.OrganizationRepository;
import com.gymplatform.repository.UserRepository;
import com.gymplatform.security.UserPrincipal;
import com.gymplatform.util.BodyMetricsCalculator;
import com.gymplatform.util.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class BodyMeasurementService {

    private final BodyMeasurementRepository measurementRepository;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;

    public BodyMeasurementService(BodyMeasurementRepository measurementRepository,
                                  UserRepository userRepository,
                                  OrganizationRepository organizationRepository) {
        this.measurementRepository = measurementRepository;
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
    }

    @Transactional
    public BodyMeasurementResponse create(Long organizationId, Long recorderId, BodyMeasurementCreateRequest request) {
        requireStaffRecorder(recorderId);

        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));
        User member = requireMember(organizationId, request.memberId());
        User recorder = userRepository.findById(recorderId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        BodyMeasurement measurement = new BodyMeasurement();
        measurement.setOrganization(org);
        measurement.setMember(member);
        measurement.setRecordedBy(recorder);
        measurement.setMeasuredAt(request.measuredAt() != null ? request.measuredAt() : Instant.now());
        applyRequest(measurement, request);

        BodyMeasurement saved = measurementRepository.save(measurement);
        BodyMeasurement previous = findPreviousForMember(organizationId, member.getId(), saved.getId()).orElse(null);
        return toResponse(saved, previous);
    }

    @Transactional(readOnly = true)
    public BodyMeasurementResponse analyzePreview(Long organizationId, BodyMeasurementCreateRequest request) {
        requireStaffRecorder(SecurityUtils.currentUser().getId());
        requireMember(organizationId, request.memberId());

        BodyMeasurement draft = new BodyMeasurement();
        draft.setAgeYears(request.ageYears());
        draft.setSex(request.sex());
        draft.setWeightKg(request.weightKg());
        draft.setHeightCm(request.heightCm());
        draft.setNeckCm(request.neckCm());
        draft.setChestCm(request.chestCm());
        draft.setWaistCm(request.waistCm());
        draft.setHipsCm(request.hipsCm());
        draft.setShouldersCm(request.shouldersCm());
        draft.setLeftArmCm(request.leftArmCm());
        draft.setRightArmCm(request.rightArmCm());
        draft.setLeftForearmCm(request.leftForearmCm());
        draft.setRightForearmCm(request.rightForearmCm());
        draft.setLeftThighCm(request.leftThighCm());
        draft.setRightThighCm(request.rightThighCm());
        draft.setLeftCalfCm(request.leftCalfCm());
        draft.setRightCalfCm(request.rightCalfCm());

        User member = userRepository.findById(request.memberId())
                .orElseThrow(() -> new ResourceNotFoundException("Miembro no encontrado"));
        BodyMeasurement previous = measurementRepository
                .findTopByOrganizationIdAndMemberIdOrderByMeasuredAtDesc(organizationId, member.getId())
                .orElse(null);

        BodyMeasurementAnalysis analysis = BodyMetricsCalculator.analyze(draft, previous);
        BodyMeasurementComparison comparison = previous != null
                ? BodyMetricsCalculator.compare(draft, previous) : null;

        return new BodyMeasurementResponse(
                null,
                member.getId(),
                member.getFirstName() + " " + member.getLastName(),
                SecurityUtils.currentUser().getId(),
                "",
                draft.getMeasuredAt(),
                draft.getAgeYears(),
                draft.getSex(),
                draft.getWeightKg(),
                draft.getHeightCm(),
                draft.getNeckCm(),
                draft.getChestCm(),
                draft.getWaistCm(),
                draft.getHipsCm(),
                draft.getShouldersCm(),
                draft.getLeftArmCm(),
                draft.getRightArmCm(),
                draft.getLeftForearmCm(),
                draft.getRightForearmCm(),
                draft.getLeftThighCm(),
                draft.getRightThighCm(),
                draft.getLeftCalfCm(),
                draft.getRightCalfCm(),
                request.notes(),
                request.appointmentRequestId(),
                null,
                analysis,
                comparison
        );
    }

    @Transactional(readOnly = true)
    public List<BodyMeasurementResponse> findByMember(Long organizationId, Long memberId, Long requesterId) {
        requireMemberAccess(organizationId, memberId, requesterId);
        List<BodyMeasurement> list = measurementRepository
                .findByOrganizationIdAndMemberIdOrderByMeasuredAtDesc(organizationId, memberId);
        return list.stream()
                .map(m -> toResponse(m, findPreviousInList(list, m)))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BodyMeasurementResponse> findMine(Long organizationId, Long memberId) {
        return findByMember(organizationId, memberId, memberId);
    }

    @Transactional(readOnly = true)
    public BodyMeasurementResponse findById(Long organizationId, Long id, Long requesterId) {
        BodyMeasurement m = measurementRepository.findByIdAndOrganizationId(id, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Medición no encontrada"));
        requireMemberAccess(organizationId, m.getMember().getId(), requesterId);
        BodyMeasurement previous = findPreviousForMember(organizationId, m.getMember().getId(), m.getId()).orElse(null);
        return toResponse(m, previous);
    }

    private BodyMeasurementResponse toResponse(BodyMeasurement m, BodyMeasurement previous) {
        BodyMeasurementAnalysis analysis = BodyMetricsCalculator.analyze(m, previous);
        BodyMeasurementComparison comparison = BodyMetricsCalculator.compare(m, previous);

        User member = m.getMember();
        User recorder = m.getRecordedBy();
        return new BodyMeasurementResponse(
                m.getId(),
                member.getId(),
                member.getFirstName() + " " + member.getLastName(),
                recorder.getId(),
                recorder.getFirstName() + " " + recorder.getLastName(),
                m.getMeasuredAt(),
                m.getAgeYears(),
                m.getSex(),
                m.getWeightKg(),
                m.getHeightCm(),
                m.getNeckCm(),
                m.getChestCm(),
                m.getWaistCm(),
                m.getHipsCm(),
                m.getShouldersCm(),
                m.getLeftArmCm(),
                m.getRightArmCm(),
                m.getLeftForearmCm(),
                m.getRightForearmCm(),
                m.getLeftThighCm(),
                m.getRightThighCm(),
                m.getLeftCalfCm(),
                m.getRightCalfCm(),
                m.getNotes(),
                m.getAppointmentRequestId(),
                m.getCreatedAt(),
                analysis,
                comparison
        );
    }

    private void applyRequest(BodyMeasurement m, BodyMeasurementCreateRequest request) {
        m.setAgeYears(request.ageYears());
        m.setSex(request.sex());
        m.setWeightKg(request.weightKg());
        m.setHeightCm(request.heightCm());
        m.setNeckCm(request.neckCm());
        m.setChestCm(request.chestCm());
        m.setWaistCm(request.waistCm());
        m.setHipsCm(request.hipsCm());
        m.setShouldersCm(request.shouldersCm());
        m.setLeftArmCm(request.leftArmCm());
        m.setRightArmCm(request.rightArmCm());
        m.setLeftForearmCm(request.leftForearmCm());
        m.setRightForearmCm(request.rightForearmCm());
        m.setLeftThighCm(request.leftThighCm());
        m.setRightThighCm(request.rightThighCm());
        m.setLeftCalfCm(request.leftCalfCm());
        m.setRightCalfCm(request.rightCalfCm());
        m.setNotes(trimToNull(request.notes()));
        m.setAppointmentRequestId(request.appointmentRequestId());
    }

    private User requireMember(Long organizationId, Long memberId) {
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Miembro no encontrado"));
        if (member.getOrganization() == null || !member.getOrganization().getId().equals(organizationId)) {
            throw new BusinessException("El miembro no pertenece a este gimnasio");
        }
        if (!member.hasRole(Role.MEMBER)) {
            throw new BusinessException("Solo se pueden registrar medidas a miembros");
        }
        return member;
    }

    private void requireStaffRecorder(Long recorderId) {
        UserPrincipal principal = SecurityUtils.currentUser();
        if (!principal.hasRole("INSTRUCTOR") && !principal.hasRole("GYM_OWNER")
                && !principal.hasRole("RECEPTIONIST")) {
            throw new BusinessException("Solo el personal autorizado puede registrar medidas");
        }
        if (!recorderId.equals(principal.getId())) {
            throw new BusinessException("Registro de medidas inválido");
        }
    }

    private void requireMemberAccess(Long organizationId, Long memberId, Long requesterId) {
        UserPrincipal principal = SecurityUtils.currentUser();
        if (requesterId.equals(memberId)) {
            if (!principal.getId().equals(memberId)) {
                throw new BusinessException("No puedes consultar medidas de otro miembro");
            }
            return;
        }
        if (!principal.hasRole("INSTRUCTOR") && !principal.hasRole("GYM_OWNER")
                && !principal.hasRole("RECEPTIONIST")) {
            throw new BusinessException("No tienes permiso para ver estas medidas");
        }
        requireMember(organizationId, memberId);
    }

    private Optional<BodyMeasurement> findPreviousForMember(Long organizationId, Long memberId, Long currentId) {
        return measurementRepository.findByOrganizationIdAndMemberIdOrderByMeasuredAtDesc(organizationId, memberId)
                .stream()
                .filter(m -> !m.getId().equals(currentId))
                .findFirst();
    }

    private BodyMeasurement findPreviousInList(List<BodyMeasurement> sortedDesc, BodyMeasurement current) {
        boolean found = false;
        for (BodyMeasurement m : sortedDesc) {
            if (m.getId().equals(current.getId())) {
                found = true;
                continue;
            }
            if (found) return m;
        }
        return null;
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
