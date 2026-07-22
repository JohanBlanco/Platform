package com.gymplatform.service;

import com.gymplatform.domain.entity.Activity;
import com.gymplatform.domain.entity.ActivityOccurrenceCancellation;
import com.gymplatform.domain.entity.ActivityOccurrenceOverride;
import com.gymplatform.domain.entity.Organization;
import com.gymplatform.domain.entity.Reservation;
import com.gymplatform.domain.entity.User;
import com.gymplatform.domain.enums.ReservationStatus;
import com.gymplatform.domain.entity.ActivityOccurrenceExclusion;
import com.gymplatform.dto.ActivityOccurrenceCancelRequest;
import com.gymplatform.dto.ActivityOccurrenceScopeRequest;
import com.gymplatform.dto.ActivityOccurrenceEditRequest;
import com.gymplatform.dto.ActivityRequest;
import com.gymplatform.dto.ActivityReservationImpactResponse;
import com.gymplatform.dto.ActivityReservationImpactResponse.AffectedReservationItem;
import com.gymplatform.dto.ActivityResponse;
import com.gymplatform.exception.BusinessException;
import com.gymplatform.exception.ResourceNotFoundException;
import com.gymplatform.repository.ActivityOccurrenceCancellationRepository;
import com.gymplatform.repository.ActivityOccurrenceExclusionRepository;
import com.gymplatform.repository.ActivityOccurrenceOverrideRepository;
import com.gymplatform.repository.ActivityPromotionRepository;
import com.gymplatform.repository.ActivityRepository;
import com.gymplatform.repository.OrganizationRepository;
import com.gymplatform.repository.ReservationRepository;
import com.gymplatform.repository.UserRepository;
import com.gymplatform.util.ActivityOverlapUtil;
import com.gymplatform.util.ActivityRecurrenceUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ActivityService {

    private static final int DEFAULT_EXPAND_DAYS = 90;
    private static final List<ReservationStatus> ACTIVE_STATUSES =
            List.of(ReservationStatus.CONFIRMED);

    private final ActivityRepository activityRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final ReservationRepository reservationRepository;
    private final ActivityOccurrenceOverrideRepository overrideRepository;
    private final ActivityOccurrenceCancellationRepository cancellationRepository;
    private final ActivityOccurrenceExclusionRepository exclusionRepository;
    private final ActivityPromotionRepository promotionRepository;

    public ActivityService(ActivityRepository activityRepository,
                           OrganizationRepository organizationRepository,
                           UserRepository userRepository,
                           ReservationRepository reservationRepository,
                           ActivityOccurrenceOverrideRepository overrideRepository,
                           ActivityOccurrenceCancellationRepository cancellationRepository,
                           ActivityOccurrenceExclusionRepository exclusionRepository,
                           ActivityPromotionRepository promotionRepository) {
        this.activityRepository = activityRepository;
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
        this.reservationRepository = reservationRepository;
        this.overrideRepository = overrideRepository;
        this.cancellationRepository = cancellationRepository;
        this.exclusionRepository = exclusionRepository;
        this.promotionRepository = promotionRepository;
    }

    @Transactional
    public ActivityResponse create(Long organizationId, ActivityRequest request) {
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));

        Activity activity = new Activity();
        applyRequest(activity, request);
        activity.setOrganization(org);
        assertNoOverlap(org.getId(), activity, null);
        return toSeriesResponse(activityRepository.save(activity));
    }

    @Transactional
    public ActivityResponse update(Long organizationId, Long id, ActivityRequest request) {
        Activity activity = requireActiveActivity(organizationId, id);
        Activity preview = copySchedule(activity);
        applyRequest(preview, request);

        List<Reservation> affected = findAffectedReservations(activity.getId(), preview);
        if (!affected.isEmpty() && !Boolean.TRUE.equals(request.confirmAffectedReservations())) {
            throw new BusinessException(
                    "Este cambio afectará " + affected.size()
                            + " reservaciones activas. Confirma para cancelarlas y guardar."
            );
        }
        if (!affected.isEmpty()) {
            cancelReservations(affected);
        }

        applyRequest(activity, request);
        assertNoOverlap(activity.getOrganization().getId(), activity, activity.getId());
        return toSeriesResponse(activityRepository.save(activity));
    }

    @Transactional
    public ActivityResponse editOccurrence(Long organizationId, Long id, ActivityOccurrenceEditRequest request) {
        Activity activity = requireActiveActivity(organizationId, id);
        assertValidOccurrence(activity, request.occurrenceDate());

        if ("SERIES".equalsIgnoreCase(request.scope())) {
            ActivityRequest seriesRequest = toSeriesRequest(activity, request);
            ActivityResponse updated = update(organizationId, id, seriesRequest);
            overrideRepository.findByActivityIdAndOccurrenceDate(id, request.occurrenceDate())
                    .ifPresent(overrideRepository::delete);
            return updated;
        }

        if (!"OCCURRENCE".equalsIgnoreCase(request.scope())) {
            throw new BusinessException("Alcance inválido. Usa OCCURRENCE o SERIES.");
        }

        if (!activity.isRecurring()) {
            ActivityRequest singleRequest = toSeriesRequest(activity, request);
            return update(organizationId, id, singleRequest);
        }

        assertOccurrenceNoOverlap(
                organizationId,
                activity,
                request.occurrenceDate(),
                request.startTime(),
                request.endTime(),
                activity.isAllDay()
        );

        ActivityOccurrenceOverride override = overrideRepository
                .findByActivityIdAndOccurrenceDate(id, request.occurrenceDate())
                .orElseGet(ActivityOccurrenceOverride::new);
        override.setActivity(activity);
        override.setOccurrenceDate(request.occurrenceDate());
        override.setStartTime(request.startTime());
        override.setEndTime(request.endTime());
        override.setLocationName(request.locationName());
        override.setCapacity(request.capacity());
        override.setUpdatedAt(Instant.now());
        overrideRepository.save(override);

        return toOccurrenceResponse(activity, request.occurrenceDate(), override, false);
    }

    @Transactional
    public void delete(Long organizationId, Long id, boolean cancelReservations) {
        Activity activity = requireActiveActivity(organizationId, id);
        List<Reservation> active = findActiveReservations(activity.getId());

        if (!active.isEmpty() && !cancelReservations) {
            throw new BusinessException(
                    "Esta actividad tiene " + active.size()
                            + " reservaciones activas. Confirma para cancelar la actividad y esas reservaciones."
            );
        }
        if (!active.isEmpty()) {
            cancelReservations(active);
        }

        activity.setActive(false);
        activityRepository.save(activity);
    }

    public ActivityReservationImpactResponse getCancelImpact(
            Long organizationId,
            Long id,
            LocalDate occurrenceDate,
            String scope) {
        Activity activity = requireActiveActivity(organizationId, id);
        assertOccurrenceInSeries(activity, occurrenceDate);

        List<Reservation> active = findActiveReservations(id);
        List<Reservation> affected = resolveCancelAffectedReservations(activity, occurrenceDate, scope, active);
        return toImpact(active, affected);
    }

    @Transactional
    public void cancelOccurrence(Long organizationId, Long id, ActivityOccurrenceCancelRequest request) {
        Activity activity = requireActiveActivity(organizationId, id);
        assertOccurrenceInSeries(activity, request.occurrenceDate());

        if ("SERIES".equalsIgnoreCase(request.scope()) || !activity.isRecurring()) {
            delete(organizationId, id, Boolean.TRUE.equals(request.cancelReservations()));
            return;
        }

        if (!"OCCURRENCE".equalsIgnoreCase(request.scope())) {
            throw new BusinessException("Alcance inválido. Usa OCCURRENCE o SERIES.");
        }

        List<Reservation> active = findActiveReservations(id).stream()
                .filter(r -> r.getOccurrenceDate().equals(request.occurrenceDate()))
                .toList();
        if (!active.isEmpty() && !Boolean.TRUE.equals(request.cancelReservations())) {
            throw new BusinessException(
                    "Esta clase tiene " + active.size()
                            + " reservaciones activas. Confirma para cancelarlas."
            );
        }
        if (!active.isEmpty()) {
            cancelReservations(active);
        }

        if (cancellationRepository.existsByActivityIdAndOccurrenceDate(id, request.occurrenceDate())) {
            return;
        }

        ActivityOccurrenceCancellation cancellation = new ActivityOccurrenceCancellation();
        cancellation.setActivity(activity);
        cancellation.setOccurrenceDate(request.occurrenceDate());
        cancellation.setCancelledAt(Instant.now());
        cancellationRepository.save(cancellation);

        overrideRepository.findByActivityIdAndOccurrenceDate(id, request.occurrenceDate())
                .ifPresent(overrideRepository::delete);
    }

    @Transactional
    public void restoreOccurrence(Long organizationId, Long id, ActivityOccurrenceScopeRequest request) {
        Activity activity = requireActivity(organizationId, id);
        assertOccurrenceInSeries(activity, request.occurrenceDate());

        if (exclusionRepository.existsByActivityIdAndOccurrenceDate(id, request.occurrenceDate())) {
            throw new BusinessException("Esta clase fue eliminada y no se puede reactivar");
        }

        if ("SERIES".equalsIgnoreCase(request.scope()) || !activity.isRecurring()) {
            restore(organizationId, id);
            return;
        }

        if (!"OCCURRENCE".equalsIgnoreCase(request.scope())) {
            throw new BusinessException("Alcance inválido. Usa OCCURRENCE o SERIES.");
        }

        cancellationRepository.findByActivityIdAndOccurrenceDate(id, request.occurrenceDate())
                .ifPresent(cancellationRepository::delete);
    }

    @Transactional
    public void deleteOccurrence(Long organizationId, Long id, ActivityOccurrenceScopeRequest request) {
        Activity activity = requireActivity(organizationId, id);
        assertOccurrenceInSeries(activity, request.occurrenceDate());

        if ("SERIES".equalsIgnoreCase(request.scope()) || !activity.isRecurring()) {
            purgeActivity(activity);
            return;
        }

        if (!"OCCURRENCE".equalsIgnoreCase(request.scope())) {
            throw new BusinessException("Alcance inválido. Usa OCCURRENCE o SERIES.");
        }

        if (!exclusionRepository.existsByActivityIdAndOccurrenceDate(id, request.occurrenceDate())) {
            ActivityOccurrenceExclusion exclusion = new ActivityOccurrenceExclusion();
            exclusion.setActivity(activity);
            exclusion.setOccurrenceDate(request.occurrenceDate());
            exclusion.setExcludedAt(Instant.now());
            exclusionRepository.save(exclusion);
        }

        List<Reservation> active = findActiveReservations(id).stream()
                .filter(r -> r.getOccurrenceDate().equals(request.occurrenceDate()))
                .toList();
        if (!active.isEmpty()) {
            cancelReservations(active);
        }

        cancellationRepository.findByActivityIdAndOccurrenceDate(id, request.occurrenceDate())
                .ifPresent(cancellationRepository::delete);
        overrideRepository.findByActivityIdAndOccurrenceDate(id, request.occurrenceDate())
                .ifPresent(overrideRepository::delete);
    }

    @Transactional
    public ActivityResponse restore(Long organizationId, Long id) {
        Activity activity = requireActivity(organizationId, id);
        if (activity.isActive()) {
            throw new BusinessException("La actividad ya está activa");
        }
        if (activity.getEndDate().isBefore(LocalDate.now())) {
            throw new BusinessException("No se puede reactivar una actividad ya vencida");
        }
        activity.setActive(true);
        return toSeriesResponse(activityRepository.save(activity));
    }

    public ActivityReservationImpactResponse getDeleteImpact(Long organizationId, Long id) {
        requireActiveActivity(organizationId, id);
        List<Reservation> active = findActiveReservations(id);
        return toImpact(active, active);
    }

    public ActivityReservationImpactResponse previewUpdateImpact(Long organizationId, Long id, ActivityRequest request) {
        Activity activity = requireActiveActivity(organizationId, id);
        Activity preview = copySchedule(activity);
        applyRequest(preview, request);

        List<Reservation> active = findActiveReservations(activity.getId());
        List<Reservation> affected = findAffectedReservations(activity.getId(), preview);
        return toImpact(active, affected);
    }

    @Transactional
    public List<ActivityResponse> findSeries(Long organizationId) {
        purgeExpiredForOrganization(organizationId);
        return activityRepository
                .findByOrganizationIdAndActiveTrueOrderByStartDateAscStartTimeAsc(organizationId)
                .stream()
                .map(this::toSeriesResponse)
                .toList();
    }

    @Transactional
    public List<ActivityResponse> findCancelledSeries(Long organizationId) {
        purgeExpiredForOrganization(organizationId);
        LocalDate today = LocalDate.now();
        return activityRepository
                .findEmergencyCancelledByOrganization(organizationId, today)
                .stream()
                .map(this::toSeriesResponse)
                .toList();
    }

    @Transactional
    public List<ActivityResponse> findByOrganization(Long organizationId, LocalDate from, LocalDate to) {
        purgeExpiredForOrganization(organizationId);
        LocalDate rangeFrom = from != null ? from : LocalDate.now();
        LocalDate rangeTo = to != null ? to : rangeFrom.plusDays(DEFAULT_EXPAND_DAYS);

        List<Activity> series = activityRepository.findSeriesOverlapping(organizationId, rangeFrom, rangeTo);
        List<Long> activityIds = series.stream().map(Activity::getId).toList();
        Map<Long, Map<LocalDate, ActivityOccurrenceOverride>> overrides =
                loadOverrides(series, rangeFrom, rangeTo);
        Map<Long, Set<LocalDate>> cancelledDates = loadCancelledDates(activityIds, rangeFrom, rangeTo);
        Map<Long, Set<LocalDate>> excludedDates = loadExcludedDates(activityIds, rangeFrom, rangeTo);
        List<ActivityResponse> result = new ArrayList<>();

        for (Activity activity : series) {
            List<LocalDate> occurrences = ActivityRecurrenceUtil.expandOccurrences(
                    activity.getStartDate(),
                    activity.getEndDate(),
                    activity.isRecurring(),
                    activity.getRepeatDays(),
                    rangeFrom,
                    rangeTo
            );
            Map<LocalDate, ActivityOccurrenceOverride> activityOverrides =
                    overrides.getOrDefault(activity.getId(), Map.of());
            Set<LocalDate> activityCancelled = cancelledDates.getOrDefault(activity.getId(), Set.of());
            Set<LocalDate> activityExcluded = excludedDates.getOrDefault(activity.getId(), Set.of());
            for (LocalDate occurrence : occurrences) {
                if (activityExcluded.contains(occurrence)) {
                    continue;
                }
                boolean occurrenceCancelled = !activity.isActive() || activityCancelled.contains(occurrence);
                result.add(toOccurrenceResponse(
                        activity,
                        occurrence,
                        activityOverrides.get(occurrence),
                        occurrenceCancelled));
            }
        }

        result.sort(Comparator
                .comparing(ActivityResponse::activityDate)
                .thenComparing(ActivityResponse::startTime));
        return result;
    }

    @Transactional
    public int purgeExpiredActivities(Long organizationId) {
        return purgeExpiredForOrganization(organizationId);
    }

    @Transactional
    public int purgeAllExpiredActivities() {
        LocalDate retentionCutoff = LocalDate.now().minusMonths(1);
        List<Activity> expired = activityRepository.findAllExpired(retentionCutoff);
        for (Activity activity : expired) {
            purgeActivity(activity);
        }
        return expired.size();
    }

    private int purgeExpiredForOrganization(Long organizationId) {
        LocalDate retentionCutoff = LocalDate.now().minusMonths(1);
        List<Activity> expired = activityRepository.findExpiredByOrganization(organizationId, retentionCutoff);
        for (Activity activity : expired) {
            purgeActivity(activity);
        }
        return expired.size();
    }

    private void purgeActivity(Activity activity) {
        Long activityId = activity.getId();
        promotionRepository.deleteByActivityId(activityId);
        reservationRepository.deleteByActivityId(activityId);
        overrideRepository.deleteByActivityId(activityId);
        cancellationRepository.deleteByActivityId(activityId);
        exclusionRepository.deleteByActivityId(activityId);
        activityRepository.delete(activity);
    }

    public ActivityResponse findById(Long organizationId, Long id) {
        return toSeriesResponse(requireActiveActivity(organizationId, id));
    }

    public void assertValidOccurrence(Activity activity, LocalDate occurrenceDate) {
        assertOccurrenceScheduled(activity, occurrenceDate);
    }

    private void assertOccurrenceScheduled(Activity activity, LocalDate occurrenceDate) {
        assertOccurrenceInSeries(activity, occurrenceDate);
        if (exclusionRepository.existsByActivityIdAndOccurrenceDate(activity.getId(), occurrenceDate)) {
            throw new BusinessException("Esta clase fue eliminada");
        }
        if (!activity.isActive()) {
            throw new BusinessException("Esta actividad fue cancelada");
        }
        if (cancellationRepository.existsByActivityIdAndOccurrenceDate(activity.getId(), occurrenceDate)) {
            throw new BusinessException("Esta clase fue cancelada");
        }
    }

    private void assertOccurrenceInSeries(Activity activity, LocalDate occurrenceDate) {
        if (!isOccurrenceValid(activity, occurrenceDate)) {
            throw new BusinessException("La fecha seleccionada no corresponde a una clase programada");
        }
    }

    private List<Reservation> resolveCancelAffectedReservations(
            Activity activity,
            LocalDate occurrenceDate,
            String scope,
            List<Reservation> active) {
        if ("OCCURRENCE".equalsIgnoreCase(scope) && activity.isRecurring()) {
            return active.stream()
                    .filter(r -> r.getOccurrenceDate().equals(occurrenceDate))
                    .toList();
        }
        return active;
    }

    private ActivityRequest toSeriesRequest(Activity activity, ActivityOccurrenceEditRequest request) {
        return new ActivityRequest(
                activity.getName(),
                activity.getDescription(),
                activity.getImageUrl(),
                activity.getStartDate(),
                activity.getEndDate(),
                request.startTime(),
                request.endTime(),
                request.locationName() != null ? request.locationName() : activity.getLocationName(),
                activity.getInstructor() != null ? activity.getInstructor().getId() : null,
                request.capacity() != null ? request.capacity() : activity.getCapacity(),
                activity.isRecurring(),
                ActivityRecurrenceUtil.parseRepeatDays(activity.getRepeatDays()),
                activity.isAllDay(),
                request.confirmAffectedReservations()
        );
    }

    private Map<Long, Set<LocalDate>> loadCancelledDates(
            List<Long> activityIds, LocalDate from, LocalDate to) {
        if (activityIds.isEmpty()) {
            return Map.of();
        }
        return cancellationRepository.findByActivityIdsAndOccurrenceDateBetween(activityIds, from, to)
                .stream()
                .collect(Collectors.groupingBy(
                        c -> c.getActivity().getId(),
                        Collectors.mapping(ActivityOccurrenceCancellation::getOccurrenceDate, Collectors.toSet())));
    }

    private Map<Long, Set<LocalDate>> loadExcludedDates(
            List<Long> activityIds, LocalDate from, LocalDate to) {
        if (activityIds.isEmpty()) {
            return Map.of();
        }
        return exclusionRepository.findByActivityIdsAndOccurrenceDateBetween(activityIds, from, to)
                .stream()
                .collect(Collectors.groupingBy(
                        e -> e.getActivity().getId(),
                        Collectors.mapping(ActivityOccurrenceExclusion::getOccurrenceDate, Collectors.toSet())));
    }

    private Map<Long, Map<LocalDate, ActivityOccurrenceOverride>> loadOverrides(
            List<Activity> series, LocalDate from, LocalDate to) {
        if (series.isEmpty()) {
            return Map.of();
        }
        List<Long> ids = series.stream().map(Activity::getId).toList();
        List<ActivityOccurrenceOverride> overrides =
                overrideRepository.findByActivityIdsAndOccurrenceDateBetween(ids, from, to);
        Map<Long, Map<LocalDate, ActivityOccurrenceOverride>> result = new HashMap<>();
        for (ActivityOccurrenceOverride override : overrides) {
            result.computeIfAbsent(override.getActivity().getId(), k -> new HashMap<>())
                    .put(override.getOccurrenceDate(), override);
        }
        return result;
    }

    private Activity requireActivity(Long organizationId, Long id) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Actividad no encontrada"));
        if (!activity.getOrganization().getId().equals(organizationId)) {
            throw new BusinessException("La actividad no pertenece a este gimnasio");
        }
        return activity;
    }

    private Activity requireActiveActivity(Long organizationId, Long id) {
        Activity activity = requireActivity(organizationId, id);
        if (!activity.isActive()) {
            throw new BusinessException("La actividad ya está cancelada");
        }
        return activity;
    }

    private Activity copySchedule(Activity source) {
        Activity copy = new Activity();
        copy.setStartDate(source.getStartDate());
        copy.setEndDate(source.getEndDate());
        copy.setRecurring(source.isRecurring());
        copy.setRepeatDays(source.getRepeatDays());
        return copy;
    }

    private List<Reservation> findActiveReservations(Long activityId) {
        return reservationRepository.findByActivityIdAndStatusInWithMember(activityId, ACTIVE_STATUSES);
    }

    private List<Reservation> findAffectedReservations(Long activityId, Activity newSchedule) {
        return findActiveReservations(activityId).stream()
                .filter(r -> !isOccurrenceValid(newSchedule, r.getOccurrenceDate()))
                .sorted(Comparator.comparing(Reservation::getOccurrenceDate))
                .toList();
    }

    private boolean isOccurrenceValid(Activity schedule, LocalDate occurrenceDate) {
        return !ActivityRecurrenceUtil.expandOccurrences(
                schedule.getStartDate(),
                schedule.getEndDate(),
                schedule.isRecurring(),
                schedule.getRepeatDays(),
                occurrenceDate,
                occurrenceDate
        ).isEmpty();
    }

    private void cancelReservations(List<Reservation> reservations) {
        Instant now = Instant.now();
        for (Reservation reservation : reservations) {
            if (reservation.getActivity() != null) {
                reservation.setActivityName(reservation.getActivity().getName());
            }
            reservation.setStatus(ReservationStatus.CANCELLED);
            reservation.setActivity(null);
            reservation.setUpdatedAt(now);
        }
        reservationRepository.saveAll(reservations);
    }

    private ActivityReservationImpactResponse toImpact(List<Reservation> active, List<Reservation> affected) {
        List<AffectedReservationItem> items = affected.stream()
                .map(r -> new AffectedReservationItem(
                        r.getId(),
                        r.getOccurrenceDate(),
                        r.getMember().getFirstName() + " " + r.getMember().getLastName(),
                        r.getStatus()
                ))
                .toList();
        return new ActivityReservationImpactResponse(active.size(), affected.size(), items);
    }

    private void applyRequest(Activity activity, ActivityRequest request) {
        if (request.endDate().isBefore(request.startDate())) {
            throw new BusinessException("La fecha de fin no puede ser anterior a la de inicio");
        }

        activity.setName(request.name());
        activity.setDescription(request.description());
        if (request.imageUrl() != null) {
            String url = request.imageUrl().trim();
            activity.setImageUrl(url.isBlank() ? null : url);
        }
        activity.setStartDate(request.startDate());
        activity.setStartTime(request.startTime());
        activity.setEndTime(request.endTime());
        activity.setLocationName(request.locationName());
        activity.setCapacity(request.capacity());
        activity.setAllDay(request.allDay());

        if (request.allDay()) {
            activity.setStartTime(LocalTime.MIDNIGHT);
            activity.setEndTime(LocalTime.of(23, 59));
        }

        if (request.recurring()) {
            if (request.repeatDays() == null || request.repeatDays().isEmpty()) {
                throw new BusinessException("Selecciona al menos un día de la semana para la recurrencia");
            }
            try {
                ActivityRecurrenceUtil.validateRepeatDays(request.repeatDays());
            } catch (IllegalArgumentException ex) {
                throw new BusinessException(ex.getMessage());
            }
            activity.setRecurring(true);
            activity.setEndDate(request.endDate());
            activity.setRepeatDays(ActivityRecurrenceUtil.serializeRepeatDays(request.repeatDays()));
        } else {
            activity.setRecurring(false);
            activity.setEndDate(request.startDate());
            activity.setRepeatDays(null);
        }

        if (request.instructorId() != null) {
            User instructor = userRepository.findById(request.instructorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Instructor no encontrado"));
            activity.setInstructor(instructor);
        } else {
            activity.setInstructor(null);
        }
    }

    private ActivityResponse toSeriesResponse(Activity activity) {
        long confirmed = reservationRepository.countByActivityIdAndStatus(activity.getId(), ReservationStatus.CONFIRMED);
        return buildResponse(activity, activity.getStartDate(), confirmed, null, !activity.isActive());
    }

    private ActivityResponse toOccurrenceResponse(
            Activity activity,
            LocalDate occurrenceDate,
            ActivityOccurrenceOverride override,
            boolean occurrenceCancelled) {
        long confirmed = reservationRepository.countByActivityIdAndOccurrenceDateAndStatus(
                activity.getId(), occurrenceDate, ReservationStatus.CONFIRMED);
        return buildResponse(activity, occurrenceDate, confirmed, override, occurrenceCancelled);
    }

    private ActivityResponse buildResponse(
            Activity activity,
            LocalDate displayDate,
            long confirmed,
            ActivityOccurrenceOverride override,
            boolean occurrenceCancelled) {
        LocalTime startTime = override != null ? override.getStartTime() : activity.getStartTime();
        LocalTime endTime = override != null && override.getEndTime() != null
                ? override.getEndTime()
                : activity.getEndTime();
        String locationName = override != null && override.getLocationName() != null
                ? override.getLocationName()
                : activity.getLocationName();
        Integer capacity = override != null && override.getCapacity() != null
                ? override.getCapacity()
                : activity.getCapacity();

        boolean hasCapacity = capacity == null || confirmed < capacity;
        String instructorName = activity.getInstructor() != null
                ? activity.getInstructor().getFirstName() + " " + activity.getInstructor().getLastName()
                : null;

        return new ActivityResponse(
                activity.getId(),
                activity.getName(),
                activity.getDescription(),
                activity.getImageUrl(),
                displayDate,
                activity.getStartDate(),
                activity.getEndDate(),
                activity.isRecurring(),
                ActivityRecurrenceUtil.parseRepeatDays(activity.getRepeatDays()),
                startTime,
                endTime,
                locationName,
                activity.getInstructor() != null ? activity.getInstructor().getId() : null,
                instructorName,
                capacity,
                confirmed,
                hasCapacity,
                override != null,
                activity.isAllDay(),
                activity.isActive(),
                occurrenceCancelled,
                activity.getCreatedAt()
        );
    }

    private void assertNoOverlap(Long organizationId, Activity candidate, Long excludeActivityId) {
        LocalDate from = candidate.getStartDate();
        LocalDate to = candidate.getEndDate();
        List<ActivityResponse> existing = findByOrganization(organizationId, from, to);

        List<LocalDate> candidateDates = ActivityRecurrenceUtil.expandOccurrences(
                candidate.getStartDate(),
                candidate.getEndDate(),
                candidate.isRecurring(),
                candidate.getRepeatDays(),
                from,
                to
        );

        for (LocalDate date : candidateDates) {
            for (ActivityResponse other : existing) {
                if (excludeActivityId != null && other.id().equals(excludeActivityId)) {
                    continue;
                }
                if (!date.equals(other.activityDate())) {
                    continue;
                }
                if (ActivityOverlapUtil.timesOverlap(
                        candidate.isAllDay(),
                        candidate.getStartTime(),
                        candidate.getEndTime(),
                        other.allDay(),
                        other.startTime(),
                        other.endTime()
                )) {
                    throw new BusinessException(
                            "La actividad se solapa con «" + other.name() + "» el "
                                    + date + ". Ajusta el horario o los días."
                    );
                }
            }
        }
    }

    private void assertOccurrenceNoOverlap(
            Long organizationId,
            Activity activity,
            LocalDate occurrenceDate,
            LocalTime startTime,
            LocalTime endTime,
            boolean allDay) {
        List<ActivityResponse> existing = findByOrganization(organizationId, occurrenceDate, occurrenceDate);
        for (ActivityResponse other : existing) {
            if (other.id().equals(activity.getId()) && other.activityDate().equals(occurrenceDate)) {
                continue;
            }
            if (!occurrenceDate.equals(other.activityDate())) {
                continue;
            }
            if (ActivityOverlapUtil.timesOverlap(
                    allDay,
                    startTime,
                    endTime,
                    other.allDay(),
                    other.startTime(),
                    other.endTime()
            )) {
                throw new BusinessException(
                        "Este horario se solapa con «" + other.name() + "». Elige otro horario."
                );
            }
        }
    }
}
