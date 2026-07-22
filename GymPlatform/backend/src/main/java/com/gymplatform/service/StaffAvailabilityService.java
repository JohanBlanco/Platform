package com.gymplatform.service;

import com.gymplatform.domain.entity.AppointmentRequest;
import com.gymplatform.domain.entity.Organization;
import com.gymplatform.domain.entity.StaffAvailability;
import com.gymplatform.domain.enums.AppointmentRequestStatus;
import com.gymplatform.domain.enums.AppointmentType;
import com.gymplatform.dto.AvailableSlotResponse;
import com.gymplatform.dto.StaffAvailabilityCreate;
import com.gymplatform.dto.StaffAvailabilityRangeCreate;
import com.gymplatform.dto.StaffAvailabilityRangeMutationResponse;
import com.gymplatform.dto.StaffAvailabilityRangeResponse;
import com.gymplatform.dto.StaffAvailabilityRangeUpdate;
import com.gymplatform.dto.StaffAvailabilityUpdate;
import com.gymplatform.dto.StaffAvailabilityResponse;
import com.gymplatform.exception.BusinessException;
import com.gymplatform.exception.ResourceNotFoundException;
import com.gymplatform.repository.AppointmentRequestRepository;
import com.gymplatform.repository.OrganizationRepository;
import com.gymplatform.repository.StaffAvailabilityRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StaffAvailabilityService {

    private static final ZoneId ZONE = ZoneId.systemDefault();
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");
    private static final List<AppointmentRequestStatus> BLOCKING_STATUSES = List.of(
            AppointmentRequestStatus.PENDING,
            AppointmentRequestStatus.SCHEDULED
    );

    private final StaffAvailabilityRepository availabilityRepository;
    private final AppointmentRequestRepository appointmentRepository;
    private final OrganizationRepository organizationRepository;

    public StaffAvailabilityService(StaffAvailabilityRepository availabilityRepository,
                                      AppointmentRequestRepository appointmentRepository,
                                      OrganizationRepository organizationRepository) {
        this.availabilityRepository = availabilityRepository;
        this.appointmentRepository = appointmentRepository;
        this.organizationRepository = organizationRepository;
    }

    public List<StaffAvailabilityResponse> findForOrganization(Long organizationId, LocalDate from, LocalDate to) {
        return availabilityRepository
                .findByOrganizationIdAndStaffIsNullAndAvailabilityDateBetweenOrderByAvailabilityDateAscStartTimeAsc(
                        organizationId, from, to)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public StaffAvailabilityResponse create(Long organizationId, StaffAvailabilityCreate request) {
        validateTimeRange(request.startTime(), request.endTime(), request.slotDurationMinutes());
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Gimnasio no encontrado"));

        StaffAvailability entity = new StaffAvailability();
        entity.setStaff(null);
        entity.setOrganization(org);
        entity.setAvailabilityDate(request.availabilityDate());
        entity.setStartTime(request.startTime());
        entity.setEndTime(request.endTime());
        entity.setSlotDurationMinutes(request.slotDurationMinutes());
        StaffAvailability saved = availabilityRepository.save(entity);
        createOpenAppointmentsForBlock(saved);
        return toResponse(saved);
    }

    @Transactional
    public StaffAvailabilityRangeResponse createRange(Long organizationId, StaffAvailabilityRangeCreate request) {
        validateTimeRange(request.startTime(), request.endTime(), request.slotDurationMinutes());

        LocalDate endDate = request.endDate() != null ? request.endDate() : request.startDate();
        if (endDate.isBefore(request.startDate())) {
            throw new BusinessException("La fecha final debe ser igual o posterior a la inicial");
        }
        long daySpan = ChronoUnit.DAYS.between(request.startDate(), endDate) + 1;
        if (daySpan > 90) {
            throw new BusinessException("El rango máximo es de 90 días");
        }

        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Gimnasio no encontrado"));

        int created = 0;
        int skipped = 0;
        int appointmentsCreated = 0;
        for (LocalDate date = request.startDate(); !date.isAfter(endDate); date = date.plusDays(1)) {
            if (availabilityRepository.existsByOrganizationIdAndStaffIsNullAndAvailabilityDateAndStartTimeAndEndTime(
                    organizationId, date, request.startTime(), request.endTime())) {
                skipped++;
                continue;
            }
            StaffAvailability entity = new StaffAvailability();
            entity.setStaff(null);
            entity.setOrganization(org);
            entity.setAvailabilityDate(date);
            entity.setStartTime(request.startTime());
            entity.setEndTime(request.endTime());
            entity.setSlotDurationMinutes(request.slotDurationMinutes());
            StaffAvailability saved = availabilityRepository.save(entity);
            appointmentsCreated += createOpenAppointmentsForBlock(saved);
            created++;
        }

        if (created == 0 && skipped > 0) {
            throw new BusinessException("Ya existe disponibilidad idéntica en todas las fechas del rango");
        }

        int slotsPerDay = countSlotsInRange(request.startTime(), request.endTime(), request.slotDurationMinutes());
        return new StaffAvailabilityRangeResponse(created, skipped, slotsPerDay, appointmentsCreated);
    }

    @Transactional
    public int syncOpenAppointments(StaffAvailability block) {
        return createOpenAppointmentsForBlock(block);
    }

    @Transactional
    public int cancelOpenAppointmentsForAvailability(Long organizationId, Long availabilityId) {
        loadGymBlock(organizationId, availabilityId);
        List<AppointmentRequest> openAppointments = appointmentRepository
                .findByStaffAvailabilityIdAndStatus(availabilityId, AppointmentRequestStatus.OPEN);
        Instant now = Instant.now();
        for (AppointmentRequest appointment : openAppointments) {
            appointment.setStatus(AppointmentRequestStatus.CANCELLED);
            appointment.setStaffAvailability(null);
            appointment.setUpdatedAt(now);
            appointmentRepository.save(appointment);
        }
        return openAppointments.size();
    }

    private int createOpenAppointmentsForBlock(StaffAvailability block) {
        int created = 0;
        LocalDate date = block.getAvailabilityDate();
        Integer durationMinutes = block.getSlotDurationMinutes();
        LocalTime cursor = block.getStartTime();
        LocalTime end = block.getEndTime();

        while (true) {
            LocalTime slotEnd;
            if (durationMinutes == null) {
                slotEnd = end;
            } else {
                slotEnd = cursor.plusMinutes(durationMinutes);
                if (slotEnd.isAfter(end)) {
                    break;
                }
            }

            Instant startInstant = date.atTime(cursor).atZone(ZONE).toInstant();
            Instant endInstant = date.atTime(slotEnd).atZone(ZONE).toInstant();

            boolean alreadyOpen = !appointmentRepository.findOpenAtExactTime(
                    block.getOrganization().getId(), startInstant, endInstant).isEmpty();
            boolean blocked = !appointmentRepository.findBlockedAtExactTime(
                    block.getOrganization().getId(), startInstant, endInstant).isEmpty();
            boolean occupied = !appointmentRepository.findOverlappingForOrganization(
                    block.getOrganization().getId(),
                    startInstant,
                    endInstant,
                    BLOCKING_STATUSES,
                    null).isEmpty();
            if (!alreadyOpen && !blocked && !occupied) {
                AppointmentRequest appointment = new AppointmentRequest();
                appointment.setMember(null);
                appointment.setOrganization(block.getOrganization());
                appointment.setType(AppointmentType.CONSULTATION);
                appointment.setStatus(AppointmentRequestStatus.OPEN);
                appointment.setStaffAvailability(block);
                appointment.setScheduledStart(startInstant);
                appointment.setScheduledEnd(endInstant);
                appointmentRepository.save(appointment);
                created++;
            }

            if (durationMinutes == null) {
                break;
            }
            cursor = slotEnd;
            if (!cursor.isBefore(end)) {
                break;
            }
        }
        return created;
    }

    private void validateTimeRange(LocalTime startTime, LocalTime endTime, Integer slotDurationMinutes) {
        if (!endTime.isAfter(startTime)) {
            throw new BusinessException("La hora de fin debe ser posterior a la de inicio");
        }
        if (slotDurationMinutes != null && slotDurationMinutes <= 0) {
            throw new BusinessException("La duración del bloque debe ser mayor a cero");
        }
    }

    private int countSlotsInRange(LocalTime startTime, LocalTime endTime, Integer slotDurationMinutes) {
        if (slotDurationMinutes == null || slotDurationMinutes <= 0) {
            return 1;
        }
        long minutes = java.time.Duration.between(startTime, endTime).toMinutes();
        return (int) Math.floorDiv(minutes, slotDurationMinutes);
    }

    @Transactional
    public StaffAvailabilityResponse update(Long organizationId, Long availabilityId, StaffAvailabilityUpdate request) {
        StaffAvailability entity = loadGymBlock(organizationId, availabilityId);
        applyUpdateToBlock(organizationId, entity, request, Boolean.TRUE.equals(request.cancelAffectedReserved()));
        return toResponse(entity);
    }

    @Transactional
    public StaffAvailabilityRangeMutationResponse updateRange(Long organizationId, Long availabilityId,
                                                              StaffAvailabilityRangeUpdate request) {
        validateTimeRange(request.startTime(), request.endTime(), request.slotDurationMinutes());
        StaffAvailability anchor = loadGymBlock(organizationId, availabilityId);
        List<StaffAvailability> currentRange = findContiguousRange(anchor);
        Map<LocalDate, StaffAvailability> currentByDate = currentRange.stream()
                .collect(Collectors.toMap(StaffAvailability::getAvailabilityDate, block -> block));

        LocalDate newStart = request.startDate();
        LocalDate newEnd = request.endDate() != null ? request.endDate() : request.startDate();
        if (newEnd.isBefore(newStart)) {
            throw new BusinessException("La fecha final debe ser igual o posterior a la inicial");
        }
        long daySpan = ChronoUnit.DAYS.between(newStart, newEnd) + 1;
        if (daySpan > 90) {
            throw new BusinessException("El rango máximo es de 90 días");
        }

        for (StaffAvailability block : currentRange) {
            LocalDate date = block.getAvailabilityDate();
            if (date.isBefore(newStart) || date.isAfter(newEnd)) {
                deleteBlock(organizationId, block);
            }
        }

        StaffAvailabilityUpdate timeUpdate = new StaffAvailabilityUpdate(
                request.startTime(), request.endTime(), request.slotDurationMinutes(), null);
        boolean cancelAffected = Boolean.TRUE.equals(request.cancelAffectedReserved());
        Organization org = anchor.getOrganization();
        int appointmentsCreated = 0;
        int daysAffected = 0;

        for (LocalDate date = newStart; !date.isAfter(newEnd); date = date.plusDays(1)) {
            StaffAvailability existing = currentByDate.get(date);
            if (existing != null) {
                appointmentsCreated += applyUpdateToBlock(organizationId, existing, timeUpdate, cancelAffected);
            } else {
                if (availabilityRepository.existsByOrganizationIdAndStaffIsNullAndAvailabilityDateAndStartTimeAndEndTime(
                        organizationId, date, request.startTime(), request.endTime())) {
                    continue;
                }
                StaffAvailability entity = new StaffAvailability();
                entity.setStaff(null);
                entity.setOrganization(org);
                entity.setAvailabilityDate(date);
                entity.setStartTime(request.startTime());
                entity.setEndTime(request.endTime());
                entity.setSlotDurationMinutes(request.slotDurationMinutes());
                StaffAvailability saved = availabilityRepository.save(entity);
                appointmentsCreated += createOpenAppointmentsForBlock(saved);
            }
            daysAffected++;
        }

        return new StaffAvailabilityRangeMutationResponse(daysAffected, appointmentsCreated);
    }

    @Transactional
    public StaffAvailabilityRangeMutationResponse deleteRange(Long organizationId, Long availabilityId) {
        return deleteRange(organizationId, availabilityId, false);
    }

    @Transactional
    public StaffAvailabilityRangeMutationResponse deleteRange(Long organizationId, Long availabilityId,
                                                              boolean cancelReserved) {
        List<StaffAvailability> range = findContiguousRange(loadGymBlock(organizationId, availabilityId));
        for (StaffAvailability block : range) {
            deleteBlock(organizationId, block, cancelReserved);
        }
        return new StaffAvailabilityRangeMutationResponse(range.size(), 0);
    }

    @Transactional
    public int cancelOpenAppointmentsForRange(Long organizationId, Long availabilityId) {
        List<StaffAvailability> range = findContiguousRange(loadGymBlock(organizationId, availabilityId));
        int total = 0;
        for (StaffAvailability block : range) {
            total += cancelOpenAppointmentsForAvailability(organizationId, block.getId());
        }
        return total;
    }

    @Transactional
    public void blockSlot(Long organizationId, Long availabilityId, LocalTime startTime, LocalTime endTime) {
        StaffAvailability block = loadGymBlock(organizationId, availabilityId);
        LocalDate date = block.getAvailabilityDate();
        Instant startInstant = date.atTime(startTime).atZone(ZONE).toInstant();
        Instant endInstant = date.atTime(endTime).atZone(ZONE).toInstant();
        validateAppointmentFitsSlot(block, startInstant, endInstant);

        if (!appointmentRepository.findBlockedAtExactTime(organizationId, startInstant, endInstant).isEmpty()) {
            return;
        }

        if (!appointmentRepository.findOverlappingForOrganization(
                organizationId, startInstant, endInstant, BLOCKING_STATUSES, null).isEmpty()) {
            throw new BusinessException("Hay una cita reservada en ese horario");
        }

        List<AppointmentRequest> openAtSlot = appointmentRepository.findOpenAtExactTime(
                organizationId, startInstant, endInstant);
        Instant now = Instant.now();
        if (!openAtSlot.isEmpty()) {
            AppointmentRequest existing = openAtSlot.get(0);
            existing.setStatus(AppointmentRequestStatus.BLOCKED);
            existing.setUpdatedAt(now);
            appointmentRepository.save(existing);
            return;
        }

        AppointmentRequest blocked = new AppointmentRequest();
        blocked.setMember(null);
        blocked.setOrganization(block.getOrganization());
        blocked.setType(AppointmentType.CONSULTATION);
        blocked.setStatus(AppointmentRequestStatus.BLOCKED);
        blocked.setStaffAvailability(block);
        blocked.setScheduledStart(startInstant);
        blocked.setScheduledEnd(endInstant);
        appointmentRepository.save(blocked);
    }

    @Transactional
    public void unblockSlot(Long organizationId, Long availabilityId, LocalTime startTime, LocalTime endTime) {
        StaffAvailability block = loadGymBlock(organizationId, availabilityId);
        LocalDate date = block.getAvailabilityDate();
        Instant startInstant = date.atTime(startTime).atZone(ZONE).toInstant();
        Instant endInstant = date.atTime(endTime).atZone(ZONE).toInstant();
        validateAppointmentFitsSlot(block, startInstant, endInstant);

        List<AppointmentRequest> blockedAtSlot = appointmentRepository.findBlockedAtExactTime(
                organizationId, startInstant, endInstant);
        if (blockedAtSlot.isEmpty()) {
            throw new BusinessException("No hay espacio bloqueado en ese horario");
        }

        if (!appointmentRepository.findOverlappingForOrganization(
                organizationId, startInstant, endInstant, BLOCKING_STATUSES, null).isEmpty()) {
            throw new BusinessException("Hay una cita reservada en ese horario");
        }

        if (!appointmentRepository.findOpenAtExactTime(organizationId, startInstant, endInstant).isEmpty()) {
            for (AppointmentRequest blocked : blockedAtSlot) {
                appointmentRepository.delete(blocked);
            }
            return;
        }

        Instant now = Instant.now();
        AppointmentRequest blocked = blockedAtSlot.get(0);
        blocked.setStatus(AppointmentRequestStatus.OPEN);
        blocked.setStaffAvailability(block);
        blocked.setUpdatedAt(now);
        appointmentRepository.save(blocked);

        for (int i = 1; i < blockedAtSlot.size(); i++) {
            appointmentRepository.delete(blockedAtSlot.get(i));
        }
    }

    private StaffAvailability loadGymBlock(Long organizationId, Long availabilityId) {
        StaffAvailability entity = availabilityRepository.findById(availabilityId)
                .orElseThrow(() -> new ResourceNotFoundException("Disponibilidad no encontrada"));
        if (!entity.getOrganization().getId().equals(organizationId) || entity.getStaff() != null) {
            throw new ResourceNotFoundException("Disponibilidad no encontrada");
        }
        return entity;
    }

    private List<StaffAvailability> findContiguousRange(StaffAvailability anchor) {
        List<StaffAvailability> candidates = availabilityRepository.findMatchingBlocks(
                anchor.getOrganization().getId(),
                anchor.getStartTime(),
                anchor.getEndTime(),
                anchor.getSlotDurationMinutes());
        Set<LocalDate> dates = new HashSet<>();
        for (StaffAvailability block : candidates) {
            dates.add(block.getAvailabilityDate());
        }

        LocalDate rangeStart = anchor.getAvailabilityDate();
        while (dates.contains(rangeStart.minusDays(1))) {
            rangeStart = rangeStart.minusDays(1);
        }
        LocalDate rangeEnd = anchor.getAvailabilityDate();
        while (dates.contains(rangeEnd.plusDays(1))) {
            rangeEnd = rangeEnd.plusDays(1);
        }

        LocalDate finalStart = rangeStart;
        LocalDate finalEnd = rangeEnd;
        return candidates.stream()
                .filter(block -> !block.getAvailabilityDate().isBefore(finalStart)
                        && !block.getAvailabilityDate().isAfter(finalEnd))
                .toList();
    }

    private int applyUpdateToBlock(Long organizationId, StaffAvailability entity, StaffAvailabilityUpdate request,
                                   boolean cancelAffectedReserved) {
        validateTimeRange(request.startTime(), request.endTime(), request.slotDurationMinutes());

        LocalDate date = entity.getAvailabilityDate();
        Instant newStart = date.atTime(request.startTime()).atZone(ZONE).toInstant();
        Instant newEnd = date.atTime(request.endTime()).atZone(ZONE).toInstant();

        resolveAffectedReservedAppointments(entity, request, newStart, newEnd, cancelAffectedReserved);

        entity.setStartTime(request.startTime());
        entity.setEndTime(request.endTime());
        if (request.slotDurationMinutes() != null) {
            entity.setSlotDurationMinutes(request.slotDurationMinutes());
        }
        StaffAvailability saved = availabilityRepository.save(entity);

        cancelPlaceholderAppointmentsForAvailability(organizationId, entity.getId());
        return createOpenAppointmentsForBlock(saved);
    }

    private void resolveAffectedReservedAppointments(StaffAvailability entity, StaffAvailabilityUpdate request,
                                                     Instant newStart, Instant newEnd,
                                                     boolean cancelAffectedReserved) {
        StaffAvailability gridBlock = new StaffAvailability();
        gridBlock.setStartTime(request.startTime());
        gridBlock.setEndTime(request.endTime());
        gridBlock.setSlotDurationMinutes(request.slotDurationMinutes());
        gridBlock.setAvailabilityDate(entity.getAvailabilityDate());

        List<AppointmentRequest> affected = new ArrayList<>();
        for (AppointmentRequest appointment : appointmentRepository.findByStaffAvailabilityId(entity.getId())) {
            if (appointment.getStatus() != AppointmentRequestStatus.PENDING
                    && appointment.getStatus() != AppointmentRequestStatus.SCHEDULED) {
                continue;
            }
            Instant start = appointment.getScheduledStart();
            Instant end = appointment.getScheduledEnd();
            if (start == null || end == null) {
                continue;
            }
            boolean outsideWindow = start.isBefore(newStart) || end.isAfter(newEnd);
            boolean misaligned = !outsideWindow && !appointmentFitsSlotGrid(gridBlock, start, end);
            if (outsideWindow || misaligned) {
                affected.add(appointment);
            }
        }

        if (affected.isEmpty()) {
            return;
        }
        if (!cancelAffectedReserved) {
            throw new BusinessException(
                    "Hay " + affected.size() + " cita(s) reservada(s) incompatibles con el nuevo horario o cuadrícula. "
                            + "Cancélelas para continuar o revierta los cambios.");
        }

        Instant now = Instant.now();
        for (AppointmentRequest appointment : affected) {
            appointment.setStatus(AppointmentRequestStatus.CANCELLED);
            appointment.setStaffAvailability(null);
            appointment.setUpdatedAt(now);
            appointmentRepository.save(appointment);
        }
    }

    private boolean appointmentFitsSlotGrid(StaffAvailability block, Instant start, Instant end) {
        Integer step = block.getSlotDurationMinutes();
        if (step == null || step <= 0) {
            return true;
        }
        if (!block.getAvailabilityDate().equals(LocalDate.ofInstant(start, ZONE))) {
            return false;
        }
        LocalTime startTime = LocalTime.ofInstant(start, ZONE);
        LocalTime endTime = LocalTime.ofInstant(end, ZONE);
        if (startTime.isBefore(block.getStartTime()) || endTime.isAfter(block.getEndTime())) {
            return false;
        }
        long offsetMinutes = java.time.Duration.between(block.getStartTime(), startTime).toMinutes();
        long durationMinutes = java.time.Duration.between(startTime, endTime).toMinutes();
        return offsetMinutes >= 0
                && offsetMinutes % step == 0
                && durationMinutes >= step
                && durationMinutes % step == 0;
    }

    private void cancelPlaceholderAppointmentsForAvailability(Long organizationId, Long availabilityId) {
        loadGymBlock(organizationId, availabilityId);
        Instant now = Instant.now();
        for (AppointmentRequest appointment : appointmentRepository.findByStaffAvailabilityId(availabilityId)) {
            if (appointment.getStatus() != AppointmentRequestStatus.OPEN
                    && appointment.getStatus() != AppointmentRequestStatus.BLOCKED) {
                continue;
            }
            appointment.setStatus(AppointmentRequestStatus.CANCELLED);
            appointment.setStaffAvailability(null);
            appointment.setUpdatedAt(now);
            appointmentRepository.save(appointment);
        }
    }

    private void validateReservedWithinWindow(Long availabilityId, Instant newStart, Instant newEnd) {
        // Kept for callers that need a read-only check; updates use resolveAffectedReservedAppointments.
        List<AppointmentRequest> linked = appointmentRepository.findByStaffAvailabilityId(availabilityId);
        for (AppointmentRequest appointment : linked) {
            if (appointment.getStatus() != AppointmentRequestStatus.PENDING
                    && appointment.getStatus() != AppointmentRequestStatus.SCHEDULED) {
                continue;
            }
            Instant start = appointment.getScheduledStart();
            Instant end = appointment.getScheduledEnd();
            if (start == null || end == null
                    || start.isBefore(newStart) || end.isAfter(newEnd)) {
                throw new BusinessException(
                        "Hay citas reservadas fuera del nuevo horario. Acórtalas antes de modificar la disponibilidad.");
            }
        }
    }

    /** Cancela placeholders OPEN/BLOCKED que solapan el rango (p. ej. cita de 30 min sobre cuadrícula de 15). */
    public void consumePlaceholderSlots(StaffAvailability availability, Instant start, Instant end, Long exceptId) {
        if (availability == null) {
            return;
        }
        Instant now = Instant.now();
        for (AppointmentRequest placeholder : appointmentRepository
                .findPlaceholderOverlappingAvailability(availability.getId(), start, end)) {
            if (exceptId != null && placeholder.getId().equals(exceptId)) {
                continue;
            }
            placeholder.setStatus(AppointmentRequestStatus.CANCELLED);
            placeholder.setStaffAvailability(null);
            placeholder.setUpdatedAt(now);
            appointmentRepository.save(placeholder);
        }
    }

    @Transactional
    public void delete(Long organizationId, Long availabilityId) {
        delete(organizationId, availabilityId, false);
    }

    @Transactional
    public void delete(Long organizationId, Long availabilityId, boolean cancelReserved) {
        deleteBlock(organizationId, loadGymBlock(organizationId, availabilityId), cancelReserved);
    }

    private void deleteBlock(Long organizationId, StaffAvailability entity) {
        deleteBlock(organizationId, entity, false);
    }

    private void deleteBlock(Long organizationId, StaffAvailability entity, boolean cancelReserved) {
        if (!entity.getOrganization().getId().equals(organizationId) || entity.getStaff() != null) {
            throw new ResourceNotFoundException("Disponibilidad no encontrada");
        }

        Instant now = Instant.now();
        Instant blockStart = entity.getAvailabilityDate().atTime(entity.getStartTime()).atZone(ZONE).toInstant();
        Instant blockEnd = entity.getAvailabilityDate().atTime(entity.getEndTime()).atZone(ZONE).toInstant();
        Set<Long> processed = new HashSet<>();

        for (AppointmentRequest appointment : appointmentRepository.findByStaffAvailabilityId(entity.getId())) {
            processed.add(appointment.getId());
            applyDeleteEffectsToAppointment(appointment, cancelReserved, now);
        }

        if (cancelReserved) {
            for (AppointmentRequest appointment : appointmentRepository.findOverlappingForOrganization(
                    organizationId, blockStart, blockEnd, BLOCKING_STATUSES, null)) {
                if (processed.contains(appointment.getId())) {
                    continue;
                }
                if (!appointmentWithinBlockWindow(entity, appointment.getScheduledStart(), appointment.getScheduledEnd())) {
                    continue;
                }
                appointment.setStatus(AppointmentRequestStatus.CANCELLED);
                appointment.setStaffAvailability(null);
                appointment.setUpdatedAt(now);
                appointmentRepository.save(appointment);
                processed.add(appointment.getId());
            }
        }

        availabilityRepository.delete(entity);
    }

    private void applyDeleteEffectsToAppointment(
            AppointmentRequest appointment, boolean cancelReserved, Instant now) {
        appointment.setStaffAvailability(null);
        appointment.setUpdatedAt(now);
        if (appointment.getStatus() == AppointmentRequestStatus.OPEN
                || appointment.getStatus() == AppointmentRequestStatus.BLOCKED) {
            appointment.setStatus(AppointmentRequestStatus.CANCELLED);
        } else if (cancelReserved
                && (appointment.getStatus() == AppointmentRequestStatus.PENDING
                || appointment.getStatus() == AppointmentRequestStatus.SCHEDULED)) {
            appointment.setStatus(AppointmentRequestStatus.CANCELLED);
        }
        appointmentRepository.save(appointment);
    }

    private boolean appointmentWithinBlockWindow(StaffAvailability block, Instant start, Instant end) {
        if (start == null || end == null) {
            return false;
        }
        if (!block.getAvailabilityDate().equals(LocalDate.ofInstant(start, ZONE))) {
            return false;
        }
        LocalTime startTime = LocalTime.ofInstant(start, ZONE);
        LocalTime endTime = LocalTime.ofInstant(end, ZONE);
        return !startTime.isBefore(block.getStartTime()) && !endTime.isAfter(block.getEndTime());
    }

    public List<AvailableSlotResponse> getAvailableSlots(Long organizationId, LocalDate date) {
        return getAvailableSlots(organizationId, date, null);
    }

    /**
     * Adquiere candados del día (bloques de disponibilidad o, si no hay, el gym)
     * antes de validar/ocupar un horario. Evita n+1 reservas concurrentes sobre n cupos.
     */
    @Transactional
    public void lockBookingWindow(Long organizationId, Instant start, Instant end) {
        if (start == null) {
            organizationRepository.findByIdForUpdate(organizationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Gimnasio no encontrado"));
            return;
        }
        LocalDate date = LocalDate.ofInstant(start, ZONE);
        List<StaffAvailability> dayBlocks = availabilityRepository.findDayBlocksForUpdate(organizationId, date);
        if (dayBlocks.isEmpty()) {
            organizationRepository.findByIdForUpdate(organizationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Gimnasio no encontrado"));
        }
    }

    public List<AvailableSlotResponse> getAvailableSlots(Long organizationId, LocalDate date,
                                                         Long excludeAppointmentId) {
        Instant dayStart = date.atStartOfDay(ZONE).toInstant();
        Instant dayEnd = date.plusDays(1).atStartOfDay(ZONE).toInstant();
        List<AppointmentRequest> openSlots = appointmentRepository.findOpenForDate(organizationId, dayStart, dayEnd);

        List<AvailableSlotResponse> slots = new ArrayList<>();
        for (AppointmentRequest open : openSlots) {
            if (excludeAppointmentId != null && open.getId().equals(excludeAppointmentId)) {
                continue;
            }
            LocalTime slotStart = LocalTime.ofInstant(open.getScheduledStart(), ZONE);
            LocalTime slotEnd = LocalTime.ofInstant(open.getScheduledEnd(), ZONE);
            if (!appointmentRepository.findBlockedAtExactTime(
                    organizationId, open.getScheduledStart(), open.getScheduledEnd()).isEmpty()) {
                continue;
            }
            boolean blocked = !appointmentRepository.findOverlappingForOrganization(
                    organizationId,
                    open.getScheduledStart(),
                    open.getScheduledEnd(),
                    BLOCKING_STATUSES,
                    open.getId()).isEmpty();
            slots.add(new AvailableSlotResponse(
                    slotStart.format(TIME_FMT),
                    slotEnd.format(TIME_FMT),
                    !blocked,
                    open.getId()));
        }
        return slots;
    }

    public void validateSlot(Long organizationId, Instant start, Instant end) {
        validateSlot(organizationId, start, end, null);
    }

    public void validateSlot(Long organizationId, Instant start, Instant end, Long excludeAppointmentId) {
        if (start == null || end == null || !end.isAfter(start)) {
            throw new BusinessException("Horario de cita inválido");
        }
        LocalDate date = LocalDate.ofInstant(start, ZONE);
        LocalTime slotStart = LocalTime.ofInstant(start, ZONE);
        LocalTime slotEnd = LocalTime.ofInstant(end, ZONE);

        List<AvailableSlotResponse> slots = getAvailableSlots(organizationId, date, excludeAppointmentId);
        String startLabel = slotStart.format(TIME_FMT);
        String endLabel = slotEnd.format(TIME_FMT);
        boolean allowed = slots.stream()
                .filter(AvailableSlotResponse::available)
                .anyMatch(s -> s.startTime().equals(startLabel) && s.endTime().equals(endLabel));

        if (!allowed) {
            throw new BusinessException("El horario seleccionado no está disponible");
        }
    }

    public void validateAcceptSlot(Long organizationId, Instant start, Instant end, Long excludeAppointmentId) {
        if (start == null || end == null || !end.isAfter(start)) {
            throw new BusinessException("Horario de cita inválido");
        }
        boolean conflict = !appointmentRepository.findOverlappingForOrganization(
                organizationId, start, end, BLOCKING_STATUSES, excludeAppointmentId).isEmpty();
        if (conflict) {
            throw new BusinessException("El horario seleccionado ya está ocupado");
        }
    }

    /** Cita creada por staff fuera del bloque verde: no debe solapar disponibilidad para miembros. */
    public void validateStaffCustomSlot(Long organizationId, Instant start, Instant end) {
        if (start == null || end == null || !end.isAfter(start)) {
            throw new BusinessException("Horario de cita inválido");
        }
        LocalDate date = LocalDate.ofInstant(start, ZONE);
        LocalTime slotStart = LocalTime.ofInstant(start, ZONE);
        LocalTime slotEnd = LocalTime.ofInstant(end, ZONE);

        List<StaffAvailability> blocks = availabilityRepository
                .findByOrganizationIdAndStaffIsNullAndAvailabilityDateOrderByStartTimeAsc(organizationId, date);
        for (StaffAvailability block : blocks) {
            if (slotStart.isBefore(block.getEndTime()) && slotEnd.isAfter(block.getStartTime())) {
                throw new BusinessException("El horario no puede coincidir con la disponibilidad para miembros");
            }
        }
        validateAcceptSlot(organizationId, start, end, null);
    }

    /** True si el rango cae dentro de algún bloque de disponibilidad publicado ese día. */
    public boolean isWithinPublishedAvailability(Long organizationId, Instant start, Instant end) {
        return findContainingBlock(organizationId, start, end).isPresent();
    }

    public java.util.Optional<StaffAvailability> findContainingBlock(Long organizationId, Instant start, Instant end) {
        if (start == null || end == null || !end.isAfter(start)) {
            return java.util.Optional.empty();
        }
        LocalDate date = LocalDate.ofInstant(start, ZONE);
        LocalTime slotStart = LocalTime.ofInstant(start, ZONE);
        LocalTime slotEnd = LocalTime.ofInstant(end, ZONE);
        List<StaffAvailability> blocks = availabilityRepository
                .findByOrganizationIdAndStaffIsNullAndAvailabilityDateOrderByStartTimeAsc(organizationId, date);
        return blocks.stream()
                .filter(block -> !slotStart.isBefore(block.getStartTime())
                        && !slotEnd.isAfter(block.getEndTime()))
                .findFirst();
    }

    public void validateAppointmentFitsSlot(StaffAvailability block, Instant start, Instant end) {
        Integer step = block.getSlotDurationMinutes();
        if (step == null || step <= 0) {
            return;
        }
        if (!block.getAvailabilityDate().equals(LocalDate.ofInstant(start, ZONE))) {
            throw new BusinessException("La cita no coincide con el día de disponibilidad");
        }
        LocalTime startTime = LocalTime.ofInstant(start, ZONE);
        LocalTime endTime = LocalTime.ofInstant(end, ZONE);
        if (startTime.isBefore(block.getStartTime()) || endTime.isAfter(block.getEndTime())) {
            throw new BusinessException("La cita debe permanecer dentro de la disponibilidad");
        }
        long offsetMinutes = java.time.Duration.between(block.getStartTime(), startTime).toMinutes();
        long durationMinutes = java.time.Duration.between(startTime, endTime).toMinutes();
        if (offsetMinutes < 0 || offsetMinutes % step != 0) {
            throw new BusinessException("La cita debe alinearse con los espacios de " + step + " minutos");
        }
        if (durationMinutes < step || durationMinutes % step != 0) {
            throw new BusinessException("La cita debe durar multiplos de " + step + " minutos");
        }
    }

    private StaffAvailabilityResponse toResponse(StaffAvailability entity) {
        return new StaffAvailabilityResponse(
                entity.getId(),
                null,
                null,
                entity.getAvailabilityDate().toString(),
                entity.getStartTime().format(TIME_FMT),
                entity.getEndTime().format(TIME_FMT),
                entity.getSlotDurationMinutes()
        );
    }
}
