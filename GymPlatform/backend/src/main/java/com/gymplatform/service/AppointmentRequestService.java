package com.gymplatform.service;



import com.gymplatform.domain.entity.AppointmentRequest;

import com.gymplatform.domain.entity.Organization;

import com.gymplatform.domain.entity.StaffAvailability;

import com.gymplatform.domain.entity.User;

import com.gymplatform.domain.enums.AppointmentRequestStatus;

import com.gymplatform.domain.enums.Role;

import com.gymplatform.dto.AppointmentRequestCreate;

import com.gymplatform.dto.AppointmentRequestResponse;

import com.gymplatform.dto.AppointmentRequestScheduleUpdate;

import com.gymplatform.exception.BusinessException;

import com.gymplatform.exception.ResourceNotFoundException;

import com.gymplatform.repository.AppointmentRequestRepository;

import com.gymplatform.repository.OrganizationRepository;

import com.gymplatform.repository.UserRepository;

import com.gymplatform.util.RoleUtils;

import java.time.Instant;

import java.time.LocalDate;

import java.util.LinkedHashMap;

import java.util.List;

import java.util.Map;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;



@Service

public class AppointmentRequestService {



    private final AppointmentRequestRepository repository;

    private final UserRepository userRepository;

    private final OrganizationRepository organizationRepository;

    private final StaffAvailabilityService staffAvailabilityService;



    public AppointmentRequestService(AppointmentRequestRepository repository,

                                     UserRepository userRepository,

                                     OrganizationRepository organizationRepository,

                                     StaffAvailabilityService staffAvailabilityService) {

        this.repository = repository;

        this.userRepository = userRepository;

        this.organizationRepository = organizationRepository;

        this.staffAvailabilityService = staffAvailabilityService;

    }



    @Transactional
    public AppointmentRequestResponse create(Long organizationId, Long memberId, AppointmentRequestCreate request) {
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        if (member.getOrganization() == null || !member.getOrganization().getId().equals(organizationId)) {
            throw new ResourceNotFoundException("Usuario no encontrado");
        }
        if (request.memberId() != null && !member.getRoles().contains(Role.MEMBER)) {
            throw new BusinessException("El usuario seleccionado no es miembro del gimnasio");
        }

        AppointmentRequest entity;
        if (request.openAppointmentId() != null) {
            entity = claimOpenSlot(organizationId, member, request);
        } else {
            entity = createNewOrClaimByTime(organizationId, member, request);
        }

        applyPreferredStaff(organizationId, entity, request);
        confirmScheduledAppointment(entity, organizationId);
        return toResponse(repository.saveAndFlush(entity));
    }

    /**
     * Reserva un placeholder OPEN con bloqueo pesimista: con n espacios y n+1
     * clientes sobre el mismo horario, solo uno lo obtiene.
     */
    private AppointmentRequest claimOpenSlot(Long organizationId, User member, AppointmentRequestCreate request) {
        // Orden de candados fijo: día/gym → fila OPEN (evita deadlocks con createNewOrClaimByTime)
        AppointmentRequest peek = repository
                .findOpenByIdAndOrganizationId(request.openAppointmentId(), organizationId)
                .orElseThrow(() -> new BusinessException("El horario seleccionado ya no está disponible"));
        staffAvailabilityService.lockBookingWindow(
                organizationId, peek.getScheduledStart(), peek.getScheduledEnd());

        AppointmentRequest entity = repository
                .findOpenByIdAndOrganizationIdForUpdate(request.openAppointmentId(), organizationId)
                .orElseThrow(() -> new BusinessException("El horario seleccionado ya no está disponible"));
        if (entity.getStatus() != AppointmentRequestStatus.OPEN) {
            throw new BusinessException("El horario seleccionado ya no está disponible");
        }
        entity.setMember(member);
        entity.setType(request.type());
        entity.setNotes(request.notes());
        entity.setUpdatedAt(Instant.now());
        return entity;
    }

    private AppointmentRequest createNewOrClaimByTime(
            Long organizationId, User member, AppointmentRequestCreate request) {
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Gimnasio no encontrado"));

        AppointmentRequest entity = new AppointmentRequest();
        entity.setMember(member);
        entity.setOrganization(org);
        entity.setType(request.type());
        entity.setNotes(request.notes());

        if (request.scheduledStart() == null && request.scheduledEnd() == null) {
            return entity;
        }
        if (request.preferredStaffId() == null) {
            throw new BusinessException("Debe seleccionar un instructor de preferencia");
        }
        if (request.scheduledStart() == null || request.scheduledEnd() == null) {
            throw new BusinessException("Horario de cita inválido");
        }

        Instant start = request.scheduledStart();
        Instant end = request.scheduledEnd();
        staffAvailabilityService.lockBookingWindow(organizationId, start, end);

        // Preferir reclamar el OPEN exacto (mismo cupo físico) en vez de crear otro registro
        var openAtTime = repository.findOpenAtExactTimeForUpdate(organizationId, start, end);
        if (!openAtTime.isEmpty()) {
            AppointmentRequest open = openAtTime.get(0);
            open.setMember(member);
            open.setType(request.type());
            open.setNotes(request.notes());
            open.setUpdatedAt(Instant.now());
            return open;
        }

        boolean withinPublished = staffAvailabilityService.isWithinPublishedAvailability(
                organizationId, start, end);
        if (request.memberId() != null) {
            if (withinPublished) {
                // El espacio ya no tiene placeholder OPEN: otro cliente lo tomó
                throw new BusinessException("El horario seleccionado ya no está disponible");
            }
            staffAvailabilityService.validateStaffCustomSlot(organizationId, start, end);
        } else if (withinPublished) {
            throw new BusinessException("El horario seleccionado ya no está disponible");
        } else {
            staffAvailabilityService.validateSlot(organizationId, start, end);
        }

        entity.setScheduledStart(start);
        entity.setScheduledEnd(end);
        return entity;
    }

    private void applyPreferredStaff(Long organizationId, AppointmentRequest entity, AppointmentRequestCreate request) {
        if (request.preferredStaffId() != null) {
            User preferred = userRepository.findById(request.preferredStaffId())
                    .orElseThrow(() -> new ResourceNotFoundException("Personal no encontrado"));
            if (preferred.getOrganization() == null || !preferred.getOrganization().getId().equals(organizationId)) {
                throw new ResourceNotFoundException("Personal no encontrado");
            }
            if (!RoleUtils.isGymStaff(preferred.getRoles())) {
                throw new BusinessException("El personal seleccionado no puede atender citas");
            }
            entity.setPreferredStaff(preferred);
            return;
        }
        // Miembro reclamando OPEN sin instructor explícito: permitido
        if (request.openAppointmentId() == null
                && entity.getStatus() != AppointmentRequestStatus.OPEN
                && entity.getScheduledStart() != null) {
            throw new BusinessException("Debe seleccionar un instructor de preferencia");
        }
    }

    private void confirmScheduledAppointment(AppointmentRequest entity, Long organizationId) {

        if (entity.getScheduledStart() == null || entity.getScheduledEnd() == null) {

            return;

        }

        staffAvailabilityService.validateAcceptSlot(

                organizationId, entity.getScheduledStart(), entity.getScheduledEnd(), entity.getId());

        if (entity.getStaffAvailability() != null) {

            staffAvailabilityService.validateAppointmentFitsSlot(

                    entity.getStaffAvailability(), entity.getScheduledStart(), entity.getScheduledEnd());

        }

        entity.setStatus(AppointmentRequestStatus.SCHEDULED);

        if (entity.getPreferredStaff() != null && entity.getAssignedStaff() == null) {

            entity.setAssignedStaff(entity.getPreferredStaff());

        }

        entity.setUpdatedAt(Instant.now());

    }



    private boolean isVisibleOnCalendar(AppointmentRequest entity) {

        return entity.getStatus() != AppointmentRequestStatus.CANCELLED

                && entity.getStatus() != AppointmentRequestStatus.REJECTED;

    }



    public List<AppointmentRequestResponse> findForOrganization(Long organizationId,

                                                                Instant from,

                                                                Instant to,

                                                                boolean preferredToMe,

                                                                Long currentUserId) {

        List<AppointmentRequest> items;

        if (from != null && to != null) {

            if (preferredToMe) {

                items = repository.findScheduledInRangeForPreferredStaff(

                        organizationId, currentUserId, from, to);

            } else {

                items = repository.findScheduledInRange(organizationId, from, to);

            }

        } else {

            items = repository.findByOrganizationIdOrderByCreatedAtDesc(organizationId);

            if (preferredToMe) {

                items = items.stream()

                        .filter(a -> a.getPreferredStaff() != null

                                && a.getPreferredStaff().getId().equals(currentUserId))

                        .toList();

            }

        }

        return items.stream().filter(this::isVisibleOnCalendar).map(this::toResponse).toList();

    }



    public List<AppointmentRequestResponse> findForMember(Long memberId, Long organizationId,

                                                          Instant from, Instant to) {

        Map<Long, AppointmentRequest> merged = new LinkedHashMap<>();



        if (from != null && to != null) {

            repository.findOpenInRange(organizationId, from, to)

                    .forEach(item -> merged.put(item.getId(), item));

        }



        List<AppointmentRequest> mine = repository.findByMemberIdOrderByCreatedAtDesc(memberId);

        if (from != null && to != null) {

            mine = mine.stream()

                    .filter(a -> a.getScheduledStart() != null

                            && !a.getScheduledStart().isBefore(from)

                            && a.getScheduledStart().isBefore(to))

                    .toList();

        }

        mine.forEach(item -> merged.put(item.getId(), item));



        return merged.values().stream().filter(this::isVisibleOnCalendar).map(this::toResponse).toList();

    }



    @Transactional

    public AppointmentRequestResponse updateStatus(Long requestId, Long organizationId, AppointmentRequestStatus status) {

        AppointmentRequest entity = loadForOrg(requestId, organizationId);

        if (status == AppointmentRequestStatus.SCHEDULED && entity.getScheduledStart() == null) {

            throw new BusinessException("Asigne fecha y hora antes de confirmar la cita");

        }

        StaffAvailability availability = entity.getStaffAvailability();

        entity.setStatus(status);

        entity.setUpdatedAt(Instant.now());

        AppointmentRequest saved = repository.save(entity);

        if (status == AppointmentRequestStatus.CANCELLED && availability != null) {

            staffAvailabilityService.syncOpenAppointments(availability);

        }

        return toResponse(saved);

    }



    @Transactional

    public AppointmentRequestResponse accept(Long requestId, Long organizationId, Long staffUserId,

                                             AppointmentRequestScheduleUpdate update) {

        AppointmentRequest entity = loadForOrg(requestId, organizationId);

        if (entity.getStatus() != AppointmentRequestStatus.PENDING) {

            throw new BusinessException("Solo se pueden aceptar citas pendientes");

        }



        Instant start = update != null && update.scheduledStart() != null

                ? update.scheduledStart() : entity.getScheduledStart();

        Instant end = update != null && update.scheduledEnd() != null

                ? update.scheduledEnd() : entity.getScheduledEnd();

        if (start == null || end == null) {

            throw new BusinessException("Debe indicar fecha y hora para aceptar la cita");

        }



        Long staffId = update != null && update.assignedStaffId() != null

                ? update.assignedStaffId()

                : entity.getPreferredStaff() != null ? entity.getPreferredStaff().getId() : staffUserId;



        User staff = userRepository.findById(staffId)

                .orElseThrow(() -> new ResourceNotFoundException("Personal no encontrado"));

        staffAvailabilityService.validateAcceptSlot(organizationId, start, end, requestId);



        entity.setScheduledStart(start);

        entity.setScheduledEnd(end);

        entity.setAssignedStaff(staff);

        entity.setStatus(AppointmentRequestStatus.SCHEDULED);

        entity.setUpdatedAt(Instant.now());

        return toResponse(repository.save(entity));

    }



    @Transactional

    public AppointmentRequestResponse updateSchedule(Long requestId, Long organizationId,

                                                     AppointmentRequestScheduleUpdate update) {

        AppointmentRequest entity = loadForOrg(requestId, organizationId);

        if (entity.getStatus() == AppointmentRequestStatus.CANCELLED

                || entity.getStatus() == AppointmentRequestStatus.REJECTED

                || entity.getStatus() == AppointmentRequestStatus.COMPLETED) {

            throw new BusinessException("No se puede modificar el horario de esta cita");

        }



        Instant start = update != null && update.scheduledStart() != null

                ? update.scheduledStart() : entity.getScheduledStart();

        Instant end = update != null && update.scheduledEnd() != null

                ? update.scheduledEnd() : entity.getScheduledEnd();

        if (start == null || end == null || !end.isAfter(start)) {

            throw new BusinessException("Horario de cita inválido");

        }



        if (entity.getStatus() == AppointmentRequestStatus.OPEN) {

            StaffAvailability availability = entity.getStaffAvailability();

            if (availability != null) {

                java.time.ZoneId zone = java.time.ZoneId.systemDefault();

                LocalDate date = availability.getAvailabilityDate();

                Instant blockStart = date.atTime(availability.getStartTime()).atZone(zone).toInstant();

                Instant blockEnd = date.atTime(availability.getEndTime()).atZone(zone).toInstant();

                if (start.isBefore(blockStart) || end.isAfter(blockEnd)) {

                    throw new BusinessException("La cita debe permanecer dentro de la disponibilidad");

                }

                staffAvailabilityService.validateAppointmentFitsSlot(availability, start, end);

            }

            boolean conflict = !repository.findOverlappingForOrganization(

                    organizationId, start, end,

                    List.of(AppointmentRequestStatus.PENDING, AppointmentRequestStatus.SCHEDULED),

                    requestId).isEmpty();

            if (conflict) {

                throw new BusinessException("El horario seleccionado ya está ocupado");

            }

        } else if (entity.getStatus() == AppointmentRequestStatus.PENDING
                || entity.getStatus() == AppointmentRequestStatus.SCHEDULED) {

            StaffAvailability previousAvailability = entity.getStaffAvailability();
            java.util.Optional<StaffAvailability> targetBlock =
                    staffAvailabilityService.findContainingBlock(organizationId, start, end);

            if (targetBlock.isPresent()) {
                StaffAvailability availability = targetBlock.get();
                staffAvailabilityService.validateAppointmentFitsSlot(availability, start, end);
                entity.setStaffAvailability(availability);
            } else {
                entity.setStaffAvailability(null);
                staffAvailabilityService.validateStaffCustomSlot(organizationId, start, end);
            }

            boolean conflict = !repository.findOverlappingForOrganization(
                    organizationId, start, end,
                    List.of(AppointmentRequestStatus.PENDING, AppointmentRequestStatus.SCHEDULED),
                    requestId).isEmpty();
            if (conflict) {
                throw new BusinessException("Ese espacio no está disponible");
            }

            if (targetBlock.isPresent()) {
                staffAvailabilityService.consumePlaceholderSlots(targetBlock.get(), start, end, requestId);
            } else {
                cancelOpenSlotsAt(organizationId, start, end, requestId);
            }
            entity.setScheduledStart(start);
            entity.setScheduledEnd(end);
            entity.setUpdatedAt(Instant.now());
            AppointmentRequest saved = repository.save(entity);

            if (previousAvailability != null
                    && (saved.getStaffAvailability() == null
                    || !previousAvailability.getId().equals(saved.getStaffAvailability().getId()))) {
                staffAvailabilityService.syncOpenAppointments(previousAvailability);
            }
            if (saved.getStaffAvailability() != null) {
                staffAvailabilityService.syncOpenAppointments(saved.getStaffAvailability());
            }
            return toResponse(saved);

        } else {

            staffAvailabilityService.validateAcceptSlot(organizationId, start, end, requestId);

        }

        cancelOpenSlotsAt(organizationId, start, end, requestId);

        entity.setScheduledStart(start);

        entity.setScheduledEnd(end);

        entity.setUpdatedAt(Instant.now());

        AppointmentRequest saved = repository.save(entity);

        if (saved.getStaffAvailability() != null) {

            staffAvailabilityService.syncOpenAppointments(saved.getStaffAvailability());

        }

        return toResponse(saved);

    }

    private void cancelOpenSlotsAt(Long organizationId, Instant start, Instant end, Long exceptId) {

        for (AppointmentRequest open : repository.findOpenAtExactTime(organizationId, start, end)) {

            if (!open.getId().equals(exceptId)) {

                open.setStatus(AppointmentRequestStatus.CANCELLED);

                open.setUpdatedAt(Instant.now());

                repository.save(open);

            }

        }

    }



    @Transactional

    public AppointmentRequestResponse reject(Long requestId, Long organizationId) {

        AppointmentRequest entity = loadForOrg(requestId, organizationId);

        if (entity.getStatus() != AppointmentRequestStatus.PENDING) {

            throw new BusinessException("Solo se pueden rechazar citas pendientes");

        }

        entity.setStatus(AppointmentRequestStatus.REJECTED);

        entity.setUpdatedAt(Instant.now());

        return toResponse(repository.save(entity));

    }



    private AppointmentRequest loadForOrg(Long requestId, Long organizationId) {

        AppointmentRequest entity = repository.findById(requestId)

                .orElseThrow(() -> new ResourceNotFoundException("Solicitud de cita no encontrada"));

        if (!entity.getOrganization().getId().equals(organizationId)) {

            throw new ResourceNotFoundException("Solicitud de cita no encontrada");

        }

        return entity;

    }



    private AppointmentRequestResponse toResponse(AppointmentRequest request) {

        User member = request.getMember();

        User preferred = request.getPreferredStaff();

        User assigned = request.getAssignedStaff();

        StaffAvailability availability = request.getStaffAvailability();

        return new AppointmentRequestResponse(

                request.getId(),

                member != null ? member.getId() : null,

                member != null ? member.getFirstName() + " " + member.getLastName() : null,

                request.getType().name(),

                request.getNotes(),

                request.getStatus().name(),

                preferred != null ? preferred.getId() : null,

                preferred != null ? preferred.getFirstName() + " " + preferred.getLastName() : null,

                assigned != null ? assigned.getId() : null,

                assigned != null ? assigned.getFirstName() + " " + assigned.getLastName() : null,

                availability != null ? availability.getId() : null,

                request.getScheduledStart() != null ? request.getScheduledStart().toString() : null,

                request.getScheduledEnd() != null ? request.getScheduledEnd().toString() : null,

                request.getCreatedAt().toString()

        );

    }

}


