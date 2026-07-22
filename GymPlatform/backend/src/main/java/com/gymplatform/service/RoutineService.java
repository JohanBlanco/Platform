package com.gymplatform.service;

import com.gymplatform.domain.entity.*;
import com.gymplatform.domain.enums.Role;
import com.gymplatform.domain.enums.RoutineRequestStatus;
import com.gymplatform.domain.enums.RoutineValidityUnit;
import com.gymplatform.dto.*;
import com.gymplatform.exception.BusinessException;
import com.gymplatform.exception.ResourceNotFoundException;
import com.gymplatform.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class RoutineService {

    private static final long COMPLETED_RETENTION_HOURS = 24;

    private final RoutineRepository routineRepository;
    private final RoutineTemplateRepository templateRepository;
    private final RoutineRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final ExerciseCatalogService exerciseCatalogService;

    public RoutineService(RoutineRepository routineRepository, RoutineTemplateRepository templateRepository,
                          RoutineRequestRepository requestRepository, UserRepository userRepository,
                          OrganizationRepository organizationRepository,
                          ExerciseCatalogService exerciseCatalogService) {
        this.routineRepository = routineRepository;
        this.templateRepository = templateRepository;
        this.requestRepository = requestRepository;
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.exerciseCatalogService = exerciseCatalogService;
    }

    @Transactional
    public RoutineTemplateResponse createTemplate(Long organizationId, Long instructorId, RoutineTemplateRequest request) {
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));
        User instructor = userRepository.findById(instructorId)
                .orElseThrow(() -> new ResourceNotFoundException("Instructor no encontrado"));

        RoutineTemplate template = new RoutineTemplate();
        template.setName(request.name());
        template.setDescription(request.description());
        template.setGoal(request.goal());
        template.setInstructor(instructor);
        template.setOrganization(org);
        template.setDaysPerWeek(request.daysPerWeek());
        if (request.days() != null && !request.days().isEmpty()) {
            addDaysToTemplate(template, request.days());
        } else {
            addExercisesToTemplate(template, request.exercises());
        }

        return toTemplateResponse(templateRepository.save(template));
    }

    @Transactional
    public RoutineTemplateResponse updateTemplate(Long organizationId, Long templateId,
                                                  RoutineTemplateRequest request) {
        RoutineTemplate template = requireTemplate(organizationId, templateId);
        template.setName(request.name());
        template.setDescription(request.description());
        template.setGoal(request.goal());
        template.setDaysPerWeek(request.daysPerWeek());
        template.getDays().clear();
        template.getExercises().clear();
        if (request.days() != null && !request.days().isEmpty()) {
            addDaysToTemplate(template, request.days());
        } else {
            addExercisesToTemplate(template, request.exercises());
        }
        return toTemplateResponse(templateRepository.save(template));
    }

    @Transactional(readOnly = true)
    public List<RoutineTemplateResponse> findTemplates(Long organizationId) {
        return templateRepository.findByOrganizationIdAndActiveTrue(organizationId)
                .stream().map(this::toTemplateResponse).toList();
    }

    @Transactional
    public RoutineResponse createRoutine(Long organizationId, Long instructorId, CreateRoutineRequest request) {
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));
        User instructor = userRepository.findById(instructorId)
                .orElseThrow(() -> new ResourceNotFoundException("Instructor no encontrado"));

        Long memberId = request.memberId();
        RoutineRequest linkedRequest = null;
        if (request.routineRequestId() != null) {
            linkedRequest = requireRequest(organizationId, request.routineRequestId());
            memberId = linkedRequest.getMember().getId();
        }
        if (memberId == null) {
            throw new BusinessException("Debes indicar el miembro destinatario");
        }

        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Miembro no encontrado"));

        Routine routine = buildRoutine(org, instructor, member, request.name(), request.description(),
                request.notes(), request.temporary(), request.daysPerWeek(),
                request.validityAmount(), request.validityUnit());

        if (request.templateId() != null) {
            RoutineTemplate template = templateRepository.findById(request.templateId())
                    .orElseThrow(() -> new ResourceNotFoundException("Plantilla no encontrada"));
            routine.setTemplate(template);
            if (request.days() == null || request.days().isEmpty()) {
                if (request.exercises() == null || request.exercises().isEmpty()) {
                    copyFromTemplate(routine, template);
                } else {
                    addExercisesToRoutine(routine, request.exercises());
                }
            }
        }

        if (request.days() != null && !request.days().isEmpty()) {
            addDaysToRoutine(routine, request.days());
        } else if (request.exercises() != null && !request.exercises().isEmpty()) {
            addExercisesToRoutine(routine, request.exercises());
        }

        deactivatePreviousRoutines(member.getId());
        Routine saved = routineRepository.save(routine);
        if (linkedRequest != null) {
            completeRequest(linkedRequest, instructor, saved);
        }
        return toRoutineResponse(saved);
    }

    @Transactional
    public RoutineResponse fulfillRequest(Long organizationId, Long instructorId, Long requestId,
                                          FulfillRoutineRequest request) {
        RoutineRequest routineRequest = requireOpenRequest(organizationId, requestId);

        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));
        User fulfiller = userRepository.findById(instructorId)
                .orElseThrow(() -> new ResourceNotFoundException("Instructor no encontrado"));

        User routineInstructor = resolveRoutineInstructor(routineRequest, fulfiller);
        Routine draft = draftRoutineOf(routineRequest);
        Routine saved;
        if (draft != null) {
            applyRoutineContent(draft, request.name(), request.description(), request.notes(),
                    request.temporary(), request.daysPerWeek(), request.days(),
                    request.validityAmount(), request.validityUnit());
            draft.setActive(true);
            draft.setInstructor(routineInstructor);
            deactivatePreviousRoutines(routineRequest.getMember().getId(), draft.getId());
            saved = routineRepository.save(draft);
        } else {
            Routine routine = buildRoutine(org, routineInstructor, routineRequest.getMember(), request.name(),
                    request.description(), request.notes(), request.temporary(), request.daysPerWeek(),
                    request.validityAmount(), request.validityUnit());
            addDaysToRoutine(routine, request.days());
            deactivatePreviousRoutines(routineRequest.getMember().getId());
            saved = routineRepository.save(routine);
        }
        completeRequest(routineRequest, fulfiller, saved);
        return toRoutineResponse(saved);
    }

    /**
     * Guarda el progreso de una rutina sin completar la solicitud.
     * Deja la solicitud en {@code IN_PROGRESS} y vincula un borrador (rutina inactiva).
     */
    @Transactional
    public RoutineRequestResponse saveRequestDraft(Long organizationId, Long instructorId, Long requestId,
                                                   SaveRoutineDraftRequest request) {
        RoutineRequest routineRequest = requireOpenRequest(organizationId, requestId);

        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));
        User fulfiller = userRepository.findById(instructorId)
                .orElseThrow(() -> new ResourceNotFoundException("Instructor no encontrado"));
        User routineInstructor = resolveRoutineInstructor(routineRequest, fulfiller);

        List<RoutineDayRequest> days = normalizeDraftDays(request.days());
        Routine draft = draftRoutineOf(routineRequest);
        if (draft != null) {
            applyRoutineContent(draft, request.name(), request.description(), request.notes(),
                    request.temporary(), request.daysPerWeek(), days,
                    request.validityAmount(), request.validityUnit());
            draft.setInstructor(routineInstructor);
            routineRepository.save(draft);
        } else {
            Routine routine = buildRoutine(org, routineInstructor, routineRequest.getMember(), request.name(),
                    request.description(), request.notes(), request.temporary(), request.daysPerWeek(),
                    request.validityAmount(), request.validityUnit());
            routine.setActive(false);
            addDaysToRoutine(routine, days);
            draft = routineRepository.save(routine);
        }

        routineRequest.setStatus(RoutineRequestStatus.IN_PROGRESS);
        routineRequest.setAssignedInstructor(fulfiller);
        routineRequest.setResultingRoutine(draft);
        routineRequest.setCompletedAt(null);
        routineRequest.setUpdatedAt(Instant.now());
        return toRequestResponse(requestRepository.save(routineRequest));
    }

    @Transactional(readOnly = true)
    public RoutineResponse getRoutineForStaff(Long organizationId, Long routineId) {
        Routine routine = routineRepository.findById(routineId)
                .orElseThrow(() -> new ResourceNotFoundException("Rutina no encontrada"));
        if (!routine.getOrganization().getId().equals(organizationId)) {
            throw new BusinessException("La rutina no pertenece a este gimnasio");
        }
        return toRoutineResponse(routine);
    }

    @Transactional
    public List<RoutineResponse> assignTemplate(Long organizationId, Long instructorId, AssignTemplateRequest request) {
        RoutineTemplate template = templateRepository.findById(request.templateId())
                .orElseThrow(() -> new ResourceNotFoundException("Plantilla no encontrada"));
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));
        User instructor = userRepository.findById(instructorId)
                .orElseThrow(() -> new ResourceNotFoundException("Instructor no encontrado"));

        List<RoutineResponse> results = new ArrayList<>();
        for (Long memberId : request.memberIds()) {
            User member = userRepository.findById(memberId)
                    .orElseThrow(() -> new ResourceNotFoundException("Miembro no encontrado: " + memberId));

            Routine routine = buildRoutine(org, instructor, member, template.getName(),
                    template.getDescription(), template.getGoal(), false, template.getDaysPerWeek(),
                    request.validityAmount(), request.validityUnit());
            routine.setTemplate(template);
            copyFromTemplate(routine, template);

            deactivatePreviousRoutines(member.getId());
            results.add(toRoutineResponse(routineRepository.save(routine)));
        }
        return results;
    }

    @Transactional
    public RoutineResponse assignTemplateToRequest(Long organizationId, Long instructorId, Long requestId,
                                                   AssignRequestTemplateRequest request) {
        RoutineRequest routineRequest = requireOpenRequest(organizationId, requestId);
        discardInactiveDraft(routineRequest);

        RoutineTemplate template = templateRepository.findById(request.templateId())
                .orElseThrow(() -> new ResourceNotFoundException("Plantilla no encontrada"));
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));
        User fulfiller = userRepository.findById(instructorId)
                .orElseThrow(() -> new ResourceNotFoundException("Instructor no encontrado"));

        User routineInstructor = resolveRoutineInstructor(routineRequest, fulfiller);
        Routine routine = buildRoutine(org, routineInstructor, routineRequest.getMember(), template.getName(),
                template.getDescription(), template.getGoal(), false, template.getDaysPerWeek(),
                request.validityAmount(), request.validityUnit());
        routine.setTemplate(template);
        copyFromTemplate(routine, template);

        deactivatePreviousRoutines(routineRequest.getMember().getId());
        Routine saved = routineRepository.save(routine);
        completeRequest(routineRequest, fulfiller, saved);
        return toRoutineResponse(saved);
    }

    @Transactional
    public int purgeCompletedRoutineRequests() {
        Instant cutoff = Instant.now().minusSeconds(COMPLETED_RETENTION_HOURS * 3600L);
        return requestRepository.deleteStaleCompleted(cutoff);
    }

    public List<RoutineResponse> findByMember(Long memberId) {
        return routineRepository.findByMemberIdAndActiveTrue(memberId)
                .stream().map(this::toRoutineResponse).toList();
    }

    public List<RoutineResponse> findByOrganization(Long organizationId) {
        return routineRepository.findByOrganizationIdAndActiveTrue(organizationId)
                .stream()
                .sorted(Comparator.comparing(Routine::getCreatedAt).reversed())
                .map(this::toRoutineResponse)
                .toList();
    }

    @Transactional
    public RoutineRequestResponse createRequest(Long organizationId, Long memberId, RoutineRequestCreate request) {
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización no encontrada"));
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Miembro no encontrado"));

        if (requestRepository.existsByMemberIdAndStatusIn(
                memberId, List.of(RoutineRequestStatus.PENDING, RoutineRequestStatus.IN_PROGRESS))) {
            throw new BusinessException(
                    "Ya tienes una solicitud de rutina abierta. Espera a que te asignen una antes de pedir otra.");
        }

        User preferredInstructor = request.preferredInstructorId() != null
                ? requirePreferredInstructor(organizationId, request.preferredInstructorId())
                : null;

        RoutineRequest routineRequest = new RoutineRequest();
        routineRequest.setMember(member);
        routineRequest.setOrganization(org);
        routineRequest.setDescription(request.description());
        routineRequest.setGoals(request.goals());
        if (request.additionalNotes() != null && !request.additionalNotes().isBlank()) {
            routineRequest.setAdditionalNotes(request.additionalNotes().trim());
        }
        if (preferredInstructor != null) {
            routineRequest.setPreferredInstructor(preferredInstructor);
        }

        return toRequestResponse(requestRepository.save(routineRequest));
    }

    @Transactional(readOnly = true)
    public List<RoutineRequestResponse> findRequests(Long organizationId) {
        return requestRepository.findByOrganizationIdOrderByCreatedAtDesc(organizationId)
                .stream().map(this::toRequestResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<RoutineRequestResponse> findRequestsByMember(Long memberId) {
        return requestRepository.findByMemberIdOrderByCreatedAtDesc(memberId)
                .stream().map(this::toRequestResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<RoutineRequestResponse> findRequestsAssignedToInstructor(Long organizationId, Long instructorId) {
        List<RoutineRequest> preferred = requestRepository
                .findByOrganizationIdAndPreferredInstructorIdOrderByCreatedAtDesc(organizationId, instructorId);
        List<RoutineRequest> assigned = requestRepository
                .findByOrganizationIdAndAssignedInstructorIdOrderByCreatedAtDesc(organizationId, instructorId);

        java.util.LinkedHashMap<Long, RoutineRequest> byId = new java.util.LinkedHashMap<>();
        for (RoutineRequest r : preferred) {
            byId.put(r.getId(), r);
        }
        for (RoutineRequest r : assigned) {
            byId.putIfAbsent(r.getId(), r);
        }
        return byId.values().stream()
                .filter(r -> r.getStatus() != RoutineRequestStatus.REJECTED)
                .sorted(Comparator.comparing(RoutineRequest::getCreatedAt).reversed())
                .map(this::toRequestResponse)
                .toList();
    }

    @Transactional
    public RoutineRequestResponse updateRequestStatus(Long requestId, RoutineRequestStatus status, Long instructorId) {
        RoutineRequest routineRequest = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitud no encontrada"));
        routineRequest.setStatus(status);
        routineRequest.setUpdatedAt(Instant.now());
        if (status == RoutineRequestStatus.COMPLETED) {
            routineRequest.setCompletedAt(Instant.now());
        }
        if (instructorId != null) {
            User instructor = userRepository.findById(instructorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Instructor no encontrado"));
            routineRequest.setAssignedInstructor(instructor);
        }
        return toRequestResponse(requestRepository.save(routineRequest));
    }

    private Routine buildRoutine(Organization org, User instructor, User member, String name,
                                 String description, String notes, boolean temporary, Integer daysPerWeek,
                                 Integer validityAmount, RoutineValidityUnit validityUnit) {
        Routine routine = new Routine();
        routine.setName(name);
        routine.setDescription(description);
        routine.setNotes(notes);
        routine.setMember(member);
        routine.setInstructor(instructor);
        routine.setOrganization(org);
        routine.setTemporary(temporary);
        routine.setDaysPerWeek(daysPerWeek);
        applyValidity(routine, validityAmount, validityUnit);
        return routine;
    }

    private void applyValidity(Routine routine, Integer validityAmount, RoutineValidityUnit validityUnit) {
        if (validityAmount == null || validityUnit == null) {
            return;
        }
        if (validityAmount < 1) {
            throw new BusinessException("La vigencia debe ser al menos 1");
        }
        LocalDate from = LocalDate.now();
        LocalDate until = switch (validityUnit) {
            case DAYS -> from.plusDays(validityAmount - 1L);
            case WEEKS -> from.plusWeeks(validityAmount).minusDays(1);
            case MONTHS -> from.plusMonths(validityAmount).minusDays(1);
        };
        routine.setValidFrom(from);
        routine.setValidUntil(until);
        routine.setValidityAmount(validityAmount);
        routine.setValidityUnit(validityUnit);
    }

    private void deactivatePreviousRoutines(Long memberId) {
        deactivatePreviousRoutines(memberId, null);
    }

    private void deactivatePreviousRoutines(Long memberId, Long keepRoutineId) {
        List<Routine> active = routineRepository.findByMemberIdAndActiveTrue(memberId);
        for (Routine previous : active) {
            if (keepRoutineId != null && previous.getId().equals(keepRoutineId)) {
                continue;
            }
            previous.setActive(false);
        }
    }

    private RoutineTemplate requireTemplate(Long organizationId, Long templateId) {
        RoutineTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Plantilla no encontrada"));
        if (!template.getOrganization().getId().equals(organizationId)) {
            throw new BusinessException("La plantilla no pertenece a este gimnasio");
        }
        return template;
    }

    private User resolveRoutineInstructor(RoutineRequest routineRequest, User fulfiller) {
        if (routineRequest.getPreferredInstructor() != null) {
            return routineRequest.getPreferredInstructor();
        }
        return fulfiller;
    }

    private User requirePreferredInstructor(Long organizationId, Long instructorId) {
        User instructor = userRepository.findById(instructorId)
                .orElseThrow(() -> new ResourceNotFoundException("Instructor no encontrado"));
        if (instructor.getOrganization() == null
                || !instructor.getOrganization().getId().equals(organizationId)) {
            throw new BusinessException("El instructor no pertenece a este gimnasio");
        }
        if (!instructor.hasRole(Role.INSTRUCTOR) && !instructor.hasRole(Role.GYM_OWNER)) {
            throw new BusinessException("Debes elegir un instructor del gimnasio");
        }
        if (!instructor.isActive()) {
            throw new BusinessException("El instructor seleccionado no está activo");
        }
        return instructor;
    }

    private RoutineRequest requireRequest(Long organizationId, Long requestId) {
        RoutineRequest routineRequest = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitud no encontrada"));
        if (!routineRequest.getOrganization().getId().equals(organizationId)) {
            throw new BusinessException("La solicitud no pertenece a este gimnasio");
        }
        return routineRequest;
    }

    private RoutineRequest requireOpenRequest(Long organizationId, Long requestId) {
        RoutineRequest routineRequest = requireRequest(organizationId, requestId);
        if (routineRequest.getStatus() == RoutineRequestStatus.COMPLETED) {
            throw new BusinessException("Esta solicitud ya fue completada");
        }
        if (routineRequest.getStatus() == RoutineRequestStatus.REJECTED) {
            throw new BusinessException("No puedes asignar rutina a una solicitud rechazada");
        }
        return routineRequest;
    }

    private Routine draftRoutineOf(RoutineRequest routineRequest) {
        Routine linked = routineRequest.getResultingRoutine();
        if (linked != null && !linked.isActive()) {
            return linked;
        }
        return null;
    }

    private List<RoutineDayRequest> normalizeDraftDays(List<SaveRoutineDraftDayRequest> days) {
        if (days == null || days.isEmpty()) {
            return List.of();
        }
        return days.stream()
                .map(day -> new RoutineDayRequest(
                        day.dayLabel(),
                        day.dayNumber(),
                        day.exercises() != null ? day.exercises() : List.of()))
                .toList();
    }

    private void discardInactiveDraft(RoutineRequest routineRequest) {
        Routine draft = draftRoutineOf(routineRequest);
        if (draft == null) {
            return;
        }
        routineRequest.setResultingRoutine(null);
        routineRepository.delete(draft);
    }

    private void applyRoutineContent(Routine routine, String name, String description, String notes,
                                     boolean temporary, Integer daysPerWeek, List<RoutineDayRequest> days,
                                     Integer validityAmount, RoutineValidityUnit validityUnit) {
        routine.setName(name);
        routine.setDescription(description);
        routine.setNotes(notes);
        routine.setTemporary(temporary);
        routine.setDaysPerWeek(daysPerWeek);
        applyValidity(routine, validityAmount, validityUnit);
        routine.getDays().clear();
        routine.getExercises().clear();
        if (days != null && !days.isEmpty()) {
            addDaysToRoutine(routine, days);
        }
    }

    private void completeRequest(RoutineRequest routineRequest, User instructor, Routine routine) {
        routineRequest.setStatus(RoutineRequestStatus.COMPLETED);
        routineRequest.setAssignedInstructor(instructor);
        routineRequest.setResultingRoutine(routine);
        routineRequest.setCompletedAt(Instant.now());
        routineRequest.setUpdatedAt(Instant.now());
        requestRepository.save(routineRequest);
    }

    private void addDaysToRoutine(Routine routine, List<RoutineDayRequest> days) {
        if (days == null) {
            return;
        }
        int dayOrder = 0;
        for (RoutineDayRequest dayRequest : days) {
            RoutineDay day = new RoutineDay();
            day.setRoutine(routine);
            day.setDayNumber(dayRequest.dayNumber());
            day.setDayLabel(dayRequest.dayLabel());
            day.setOrderIndex(dayOrder++);

            int exerciseOrder = 0;
            List<RoutineExerciseRequest> exercises = dayRequest.exercises() != null
                    ? dayRequest.exercises()
                    : List.of();
            for (RoutineExerciseRequest ex : exercises) {
                RoutineExercise exercise = mapExercise(ex);
                exercise.setOrderIndex(exerciseOrder++);
                exercise.setRoutineDay(day);
                exercise.setRoutine(routine);
                day.getExercises().add(exercise);
            }
            routine.getDays().add(day);
        }
    }

    private void addDaysToTemplate(RoutineTemplate template, List<RoutineDayRequest> days) {
        int dayOrder = 0;
        for (RoutineDayRequest dayRequest : days) {
            RoutineTemplateDay day = new RoutineTemplateDay();
            day.setTemplate(template);
            day.setDayNumber(dayRequest.dayNumber());
            day.setDayLabel(dayRequest.dayLabel());
            day.setOrderIndex(dayOrder++);

            int exerciseOrder = 0;
            for (RoutineExerciseRequest ex : dayRequest.exercises()) {
                RoutineExercise exercise = mapExercise(ex);
                exercise.setOrderIndex(exerciseOrder++);
                exercise.setTemplateDay(day);
                exercise.setTemplate(template);
                day.getExercises().add(exercise);
            }
            template.getDays().add(day);
        }
    }

    private void addExercisesToTemplate(RoutineTemplate template, List<RoutineExerciseRequest> exercises) {
        if (exercises == null) return;
        for (RoutineExerciseRequest ex : exercises) {
            RoutineExercise exercise = mapExercise(ex);
            exercise.setTemplate(template);
            template.getExercises().add(exercise);
        }
    }

    private void addExercisesToRoutine(Routine routine, List<RoutineExerciseRequest> exercises) {
        if (exercises == null) return;
        for (RoutineExerciseRequest ex : exercises) {
            RoutineExercise exercise = mapExercise(ex);
            exercise.setRoutine(routine);
            routine.getExercises().add(exercise);
        }
    }

    private void copyFromTemplate(Routine routine, RoutineTemplate template) {
        if (template.getDays() != null && !template.getDays().isEmpty()) {
            copyDaysFromTemplate(routine, template);
            return;
        }
        copyFlatExercisesFromTemplate(routine, template);
    }

    private void copyDaysFromTemplate(Routine routine, RoutineTemplate template) {
        int dayOrder = 0;
        for (RoutineTemplateDay sourceDay : template.getDays()) {
            RoutineDay day = new RoutineDay();
            day.setRoutine(routine);
            day.setDayNumber(sourceDay.getDayNumber());
            day.setDayLabel(sourceDay.getDayLabel());
            day.setOrderIndex(dayOrder++);

            int exerciseOrder = 0;
            for (RoutineExercise source : sourceDay.getExercises()) {
                RoutineExercise exercise = copyExerciseFields(source);
                exercise.setOrderIndex(exerciseOrder++);
                exercise.setRoutineDay(day);
                exercise.setRoutine(routine);
                day.getExercises().add(exercise);
            }
            routine.getDays().add(day);
        }
    }

    private void copyFlatExercisesFromTemplate(Routine routine, RoutineTemplate template) {
        int index = 0;
        for (RoutineExercise source : template.getExercises()) {
            RoutineExercise exercise = copyExerciseFields(source);
            exercise.setOrderIndex(index++);
            exercise.setRoutine(routine);
            routine.getExercises().add(exercise);
        }
    }

    private RoutineExercise copyExerciseFields(RoutineExercise source) {
        RoutineExercise exercise = new RoutineExercise();
        exercise.setExerciseName(source.getExerciseName());
        exercise.setCatalogExerciseId(source.getCatalogExerciseId());
        exercise.setImageUrl(source.getImageUrl());
        exercise.setSets(source.getSets());
        exercise.setReps(source.getReps());
        exercise.setWeight(source.getWeight());
        exercise.setDurationSeconds(source.getDurationSeconds());
        exercise.setNotes(source.getNotes());
        return exercise;
    }

    private void copyExercisesFromTemplate(Routine routine, RoutineTemplate template) {
        copyFromTemplate(routine, template);
    }

    private RoutineExercise mapExercise(RoutineExerciseRequest ex) {
        RoutineExercise exercise = new RoutineExercise();
        exercise.setExerciseName(ex.exerciseName());
        exercise.setSets(ex.sets());
        exercise.setReps(ex.reps());
        exercise.setWeight(ex.weight());
        exercise.setDurationSeconds(ex.durationSeconds());
        exercise.setNotes(ex.notes());
        exercise.setOrderIndex(ex.orderIndex());

        if (ex.exerciseId() != null) {
            Exercise catalog = exerciseCatalogService.findById(ex.exerciseId());
            if (catalog != null) {
                exercise.setCatalogExerciseId(catalog.getId());
                exercise.setExerciseName(catalog.getName());
                exercise.setImageUrl(catalog.getImageUrl());
            } else {
                exercise.setCatalogExerciseId(ex.exerciseId());
            }
        }
        if (ex.imageUrl() != null && !ex.imageUrl().isBlank()) {
            exercise.setImageUrl(ex.imageUrl());
        }
        return exercise;
    }

    private RoutineTemplateResponse toTemplateResponse(RoutineTemplate template) {
        List<RoutineDayResponse> days = template.getDays().stream()
                .map(this::toTemplateDayResponse).toList();
        List<RoutineExerciseResponse> exercises = template.getExercises().stream()
                .map(this::toExerciseResponse).toList();
        return new RoutineTemplateResponse(
                template.getId(), template.getName(), template.getDescription(),
                template.getGoal(), template.getInstructor().getId(), template.getDaysPerWeek(),
                days, exercises
        );
    }

    private RoutineDayResponse toTemplateDayResponse(RoutineTemplateDay day) {
        List<RoutineExerciseResponse> exercises = day.getExercises().stream()
                .map(this::toExerciseResponse).toList();
        return new RoutineDayResponse(day.getId(), day.getDayNumber(), day.getDayLabel(),
                day.getOrderIndex(), exercises);
    }

    private RoutineResponse toRoutineResponse(Routine routine) {
        List<RoutineDayResponse> days = routine.getDays().stream()
                .map(this::toDayResponse).toList();
        List<RoutineExerciseResponse> flatExercises = routine.getExercises().stream()
                .map(this::toExerciseResponse).toList();
        return new RoutineResponse(
                routine.getId(), routine.getName(), routine.getDescription(), routine.getNotes(),
                routine.getMember().getId(),
                routine.getMember().getFirstName() + " " + routine.getMember().getLastName(),
                routine.getInstructor().getId(),
                routine.getInstructor().getFirstName() + " " + routine.getInstructor().getLastName(),
                routine.getTemplate() != null ? routine.getTemplate().getId() : null,
                routine.isTemporary(),
                routine.getDaysPerWeek(),
                routine.getValidFrom(),
                routine.getValidUntil(),
                routine.getValidityAmount(),
                routine.getValidityUnit(),
                isRoutineExpired(routine),
                days,
                flatExercises
        );
    }

    private boolean isRoutineExpired(Routine routine) {
        LocalDate until = routine.getValidUntil();
        return until != null && until.isBefore(LocalDate.now());
    }

    private RoutineDayResponse toDayResponse(RoutineDay day) {
        List<RoutineExerciseResponse> exercises = day.getExercises().stream()
                .map(this::toExerciseResponse).toList();
        return new RoutineDayResponse(day.getId(), day.getDayNumber(), day.getDayLabel(),
                day.getOrderIndex(), exercises);
    }

    private RoutineRequestResponse toRequestResponse(RoutineRequest request) {
        String assignedName = request.getAssignedInstructor() != null
                ? request.getAssignedInstructor().getFirstName() + " " + request.getAssignedInstructor().getLastName()
                : null;
        String preferredName = request.getPreferredInstructor() != null
                ? request.getPreferredInstructor().getFirstName() + " " + request.getPreferredInstructor().getLastName()
                : null;
        String routineName = request.getResultingRoutine() != null
                ? request.getResultingRoutine().getName()
                : null;
        return new RoutineRequestResponse(
                request.getId(),
                request.getMember().getId(),
                request.getMember().getFirstName() + " " + request.getMember().getLastName(),
                request.getDescription(),
                request.getGoals(),
                request.getAdditionalNotes(),
                request.getStatus().name(),
                request.getPreferredInstructor() != null ? request.getPreferredInstructor().getId() : null,
                preferredName,
                request.getAssignedInstructor() != null ? request.getAssignedInstructor().getId() : null,
                assignedName,
                request.getResultingRoutine() != null ? request.getResultingRoutine().getId() : null,
                routineName,
                request.getCompletedAt()
        );
    }

    private RoutineExerciseResponse toExerciseResponse(RoutineExercise ex) {
        return new RoutineExerciseResponse(
                ex.getId(), ex.getCatalogExerciseId(), ex.getExerciseName(), ex.getImageUrl(),
                ex.getSets(), ex.getReps(), ex.getWeight(), ex.getDurationSeconds(),
                ex.getNotes(), ex.getOrderIndex()
        );
    }
}
