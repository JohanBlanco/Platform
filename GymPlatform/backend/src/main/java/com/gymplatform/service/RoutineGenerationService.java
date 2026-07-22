package com.gymplatform.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gymplatform.domain.entity.*;
import com.gymplatform.domain.enums.ExerciseDifficulty;
import com.gymplatform.domain.enums.FormPurpose;
import com.gymplatform.domain.enums.MuscleGroup;
import com.gymplatform.dto.*;
import com.gymplatform.exception.BusinessException;
import com.gymplatform.exception.ResourceNotFoundException;
import com.gymplatform.repository.*;
import com.gymplatform.util.MemberRegistrationFormFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class RoutineGenerationService {

    private final UserRepository userRepository;
    private final MemberProfileRepository memberProfileRepository;
    private final BodyMeasurementRepository bodyMeasurementRepository;
    private final CustomFormRepository customFormRepository;
    private final CustomFormSubmissionRepository submissionRepository;
    private final RoutineRequestRepository routineRequestRepository;
    private final ExerciseRepository exerciseRepository;
    private final ObjectMapper objectMapper;

    public RoutineGenerationService(
            UserRepository userRepository,
            MemberProfileRepository memberProfileRepository,
            BodyMeasurementRepository bodyMeasurementRepository,
            CustomFormRepository customFormRepository,
            CustomFormSubmissionRepository submissionRepository,
            RoutineRequestRepository routineRequestRepository,
            ExerciseRepository exerciseRepository,
            ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.memberProfileRepository = memberProfileRepository;
        this.bodyMeasurementRepository = bodyMeasurementRepository;
        this.customFormRepository = customFormRepository;
        this.submissionRepository = submissionRepository;
        this.routineRequestRepository = routineRequestRepository;
        this.exerciseRepository = exerciseRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public RoutineGenerationContextResponse getContext(Long organizationId, Long memberId, Long routineRequestId) {
        MemberContext ctx = loadMemberContext(organizationId, memberId, routineRequestId);
        List<String> sources = new ArrayList<>();
        if (ctx.levelFromForm()) sources.add("Formulario de registro (nivel)");
        if (ctx.injuriesFromForm()) sources.add("Formulario de registro (lesiones)");
        if (ctx.goalsFromProfileOrForm()) sources.add("Perfil / registro / solicitud");
        if (ctx.sex() != null) sources.add("Expediente de medidas");
        if (ctx.age() != null) sources.add("Perfil del miembro");

        return new RoutineGenerationContextResponse(
                ctx.member().getId(),
                ctx.member().getFirstName() + " " + ctx.member().getLastName(),
                ctx.age(),
                ctx.sex(),
                ctx.level(),
                ctx.goals(),
                ctx.injuries(),
                ctx.level() != null && !ctx.level().isBlank(),
                ctx.injuries() != null && !ctx.injuries().isBlank(),
                ctx.goals() != null && !ctx.goals().isBlank(),
                ctx.sex() != null,
                sources
        );
    }

    @Transactional(readOnly = true)
    public GeneratedRoutinePlanResponse generate(Long organizationId, GenerateRoutineRequest request) {
        MemberContext ctx = loadMemberContext(organizationId, request.memberId(), request.routineRequestId());

        String focus = normalizeFocus(request.focus());
        String level = firstNonBlank(request.levelOverride(), ctx.level(), "Intermedio");
        String equipment = firstNonBlank(request.equipment(), "FULL_GYM");
        String injuries = firstNonBlank(request.injuriesNotes(), ctx.injuries(), "");
        String goals = firstNonBlank(request.goalsOverride(), ctx.goals(), focusLabel(focus));
        int daysPerWeek = request.daysPerWeek();
        int sessionMinutes = request.sessionMinutes() != null ? request.sessionMinutes() : 60;
        int exercisesPerDay = exercisesForSession(sessionMinutes, level);

        List<Exercise> catalog = exerciseRepository.findByActiveTrueOrderByMuscleGroupAscNameAsc();
        if (catalog.isEmpty()) {
            throw new BusinessException("No hay ejercicios en el catálogo para generar la rutina");
        }

        Set<MuscleGroup> avoid = avoidGroupsFromInjuries(injuries);
        List<DayPlan> dayPlans = buildSplit(daysPerWeek, focus);
        SetsReps schema = setsRepsFor(focus, level);

        List<RoutineDayResponse> days = new ArrayList<>();
        int dayNumber = 1;
        for (DayPlan plan : dayPlans) {
            List<RoutineExerciseResponse> exercises = pickExercises(
                    catalog, plan.groups(), exercisesPerDay, level, equipment, avoid, schema, focus);
            days.add(new RoutineDayResponse(
                    null,
                    dayNumber,
                    plan.label(),
                    dayNumber - 1,
                    exercises
            ));
            dayNumber++;
        }

        String memberName = ctx.member().getFirstName();
        String name = "Rutina " + focusLabel(focus) + " — " + memberName;
        String description = "Plan de " + daysPerWeek + " días/semana enfocado en "
                + focusLabel(focus).toLowerCase(Locale.ROOT)
                + (ctx.sex() != null ? "" : "")
                + ". Nivel: " + level + ".";
        String notes = buildNotes(goals, injuries, level, sessionMinutes);
        String summary = buildSummary(daysPerWeek, focus, level, equipment, injuries, avoid);

        return new GeneratedRoutinePlanResponse(
                name, description, notes, daysPerWeek, focus, summary, days
        );
    }

    private MemberContext loadMemberContext(Long organizationId, Long memberId, Long routineRequestId) {
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Miembro no encontrado"));
        if (member.getOrganization() == null || !member.getOrganization().getId().equals(organizationId)) {
            throw new BusinessException("El miembro no pertenece a este gimnasio");
        }

        MemberProfile profile = memberProfileRepository.findByUserId(memberId).orElse(null);
        Integer age = profile != null ? profile.getAge() : null;
        String profileGoals = profile != null ? blankToNull(profile.getGoals()) : null;

        String sex = bodyMeasurementRepository
                .findByOrganizationIdAndMemberIdOrderByMeasuredAtDesc(organizationId, memberId)
                .stream()
                .findFirst()
                .map(m -> m.getSex() != null ? m.getSex().name() : null)
                .orElse(null);

        Map<String, String> formAnswers = loadRegistrationAnswers(organizationId, memberId);
        String formLevel = blankToNull(formAnswers.get("f-nivel"));
        String formInjuries = blankToNull(formAnswers.get("f-lesiones"));
        String formGoals = blankToNull(formAnswers.get("f-objetivos"));
        String formPregnancy = blankToNull(formAnswers.get("f-embarazo"));

        // Señal suave de sexo desde el formulario si no hay medidas (embarazo pregunta).
        if (sex == null && formPregnancy != null) {
            if ("Sí".equalsIgnoreCase(formPregnancy) || "No".equalsIgnoreCase(formPregnancy)) {
                sex = "FEMALE";
            }
        }

        String requestGoals = null;
        String requestNotes = null;
        if (routineRequestId != null) {
            RoutineRequest req = routineRequestRepository.findById(routineRequestId).orElse(null);
            if (req != null && req.getOrganization().getId().equals(organizationId)
                    && req.getMember().getId().equals(memberId)) {
                requestGoals = firstNonBlank(req.getGoals(), req.getDescription());
                requestNotes = blankToNull(req.getAdditionalNotes());
            }
        }

        String goals = firstNonBlank(requestGoals, formGoals, profileGoals);
        String injuries = firstNonBlank(formInjuries, requestNotes);
        boolean levelFromForm = formLevel != null;
        boolean injuriesFromForm = formInjuries != null;
        boolean goalsFromKnown = goals != null;

        return new MemberContext(
                member, age, sex, formLevel, goals, injuries,
                levelFromForm, injuriesFromForm, goalsFromKnown
        );
    }

    private Map<String, String> loadRegistrationAnswers(Long organizationId, Long memberId) {
        Optional<CustomForm> form = customFormRepository
                .findByOrganizationIdAndFormPurpose(organizationId, FormPurpose.MEMBER_REGISTRATION);
        if (form.isEmpty()) {
            form = customFormRepository.findByOrganizationIdAndSlug(organizationId, MemberRegistrationFormFactory.SLUG);
        }
        if (form.isEmpty()) {
            return Map.of();
        }
        Long formId = form.get().getId();
        return submissionRepository
                .findBySubmittedBy_IdAndSubmittedBy_Organization_IdOrderByCreatedAtDesc(memberId, organizationId)
                .stream()
                .filter(s -> s.getForm() != null && Objects.equals(s.getForm().getId(), formId))
                .findFirst()
                .map(s -> stringifyAnswers(parseAnswersJson(s.getAnswersJson())))
                .orElse(Map.of());
    }

    private Map<String, Object> parseAnswersJson(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return Map.of();
        }
    }

    private Map<String, String> stringifyAnswers(Map<String, Object> answers) {
        if (answers == null || answers.isEmpty()) return Map.of();
        Map<String, String> out = new HashMap<>();
        answers.forEach((k, v) -> {
            if (v != null) out.put(k, String.valueOf(v).trim());
        });
        return out;
    }

    private List<DayPlan> buildSplit(int days, String focus) {
        return switch (days) {
            case 2 -> List.of(
                    new DayPlan("Full body A", List.of(MuscleGroup.CHEST, MuscleGroup.TRAPEZIUS, MuscleGroup.QUADRICEPS, MuscleGroup.ABS)),
                    new DayPlan("Full body B", List.of(MuscleGroup.SHOULDER, MuscleGroup.TRAPEZIUS, MuscleGroup.HAMSTRING, MuscleGroup.ABS))
            );
            case 3 -> List.of(
                    new DayPlan("Empuje (pecho/hombros/tríceps)", List.of(MuscleGroup.CHEST, MuscleGroup.SHOULDER, MuscleGroup.TRICEP)),
                    new DayPlan("Jalón (espalda/bíceps)", List.of(MuscleGroup.TRAPEZIUS, MuscleGroup.BICEP, MuscleGroup.FOREARM)),
                    new DayPlan("Pierna + core", List.of(MuscleGroup.QUADRICEPS, MuscleGroup.HAMSTRING, MuscleGroup.CALF, MuscleGroup.ABS))
            );
            case 4 -> List.of(
                    new DayPlan("Tren superior A", List.of(MuscleGroup.CHEST, MuscleGroup.SHOULDER, MuscleGroup.TRICEP)),
                    new DayPlan("Tren inferior A", List.of(MuscleGroup.QUADRICEPS, MuscleGroup.HAMSTRING, MuscleGroup.CALF, MuscleGroup.ABS)),
                    new DayPlan("Tren superior B", List.of(MuscleGroup.TRAPEZIUS, MuscleGroup.BICEP, MuscleGroup.SHOULDER)),
                    new DayPlan("Tren inferior B", List.of(MuscleGroup.HAMSTRING, MuscleGroup.QUADRICEPS, MuscleGroup.CALF, MuscleGroup.ABS))
            );
            case 5 -> {
                if ("FAT_LOSS".equals(focus)) {
                    yield List.of(
                            new DayPlan("Full body + cardio", List.of(MuscleGroup.CHEST, MuscleGroup.QUADRICEPS, MuscleGroup.ABS, MuscleGroup.CARDIO)),
                            new DayPlan("Empuje", List.of(MuscleGroup.CHEST, MuscleGroup.SHOULDER, MuscleGroup.TRICEP)),
                            new DayPlan("Jalón", List.of(MuscleGroup.TRAPEZIUS, MuscleGroup.BICEP)),
                            new DayPlan("Pierna", List.of(MuscleGroup.QUADRICEPS, MuscleGroup.HAMSTRING, MuscleGroup.CALF)),
                            new DayPlan("Core + cardio", List.of(MuscleGroup.ABS, MuscleGroup.CARDIO, MuscleGroup.SHOULDER))
                    );
                }
                yield List.of(
                        new DayPlan("Pecho + tríceps", List.of(MuscleGroup.CHEST, MuscleGroup.TRICEP)),
                        new DayPlan("Espalda + bíceps", List.of(MuscleGroup.TRAPEZIUS, MuscleGroup.BICEP)),
                        new DayPlan("Pierna", List.of(MuscleGroup.QUADRICEPS, MuscleGroup.HAMSTRING, MuscleGroup.CALF)),
                        new DayPlan("Hombros + core", List.of(MuscleGroup.SHOULDER, MuscleGroup.ABS, MuscleGroup.FOREARM)),
                        new DayPlan("Full body ligero", List.of(MuscleGroup.CHEST, MuscleGroup.TRAPEZIUS, MuscleGroup.QUADRICEPS, MuscleGroup.ABS))
                );
            }
            default -> List.of(
                    new DayPlan("Empuje A", List.of(MuscleGroup.CHEST, MuscleGroup.SHOULDER, MuscleGroup.TRICEP)),
                    new DayPlan("Jalón A", List.of(MuscleGroup.TRAPEZIUS, MuscleGroup.BICEP)),
                    new DayPlan("Pierna A", List.of(MuscleGroup.QUADRICEPS, MuscleGroup.HAMSTRING, MuscleGroup.CALF)),
                    new DayPlan("Empuje B", List.of(MuscleGroup.CHEST, MuscleGroup.SHOULDER, MuscleGroup.TRICEP)),
                    new DayPlan("Jalón B", List.of(MuscleGroup.TRAPEZIUS, MuscleGroup.BICEP, MuscleGroup.FOREARM)),
                    new DayPlan("Pierna B + core", List.of(MuscleGroup.HAMSTRING, MuscleGroup.QUADRICEPS, MuscleGroup.ABS, MuscleGroup.CALF))
            );
        };
    }

    // Helper to keep switch expressions readable — TRAPEZIUS stands in for "back" in this catalog
    private record DayPlan(String label, List<MuscleGroup> groups) {
        private DayPlan {
            groups = List.copyOf(groups);
        }
    }

    private List<RoutineExerciseResponse> pickExercises(
            List<Exercise> catalog,
            List<MuscleGroup> groups,
            int targetCount,
            String level,
            String equipment,
            Set<MuscleGroup> avoid,
            SetsReps schema,
            String focus) {

        List<MuscleGroup> filtered = groups.stream()
                .filter(g -> !avoid.contains(g))
                .toList();
        final List<MuscleGroup> usable = filtered.isEmpty() ? groups : filtered;

        List<Exercise> pool = catalog.stream()
                .filter(ex -> usable.contains(ex.getMuscleGroup()))
                .filter(ex -> matchesLevel(ex, level))
                .filter(ex -> matchesEquipment(ex, equipment))
                .collect(Collectors.toCollection(ArrayList::new));

        if (pool.size() < targetCount) {
            catalog.stream()
                    .filter(ex -> usable.contains(ex.getMuscleGroup()))
                    .filter(ex -> matchesEquipment(ex, equipment))
                    .forEach(ex -> {
                        if (!pool.contains(ex)) pool.add(ex);
                    });
        }

        Collections.shuffle(pool, ThreadLocalRandom.current());

        // Round-robin by group for balance
        Map<MuscleGroup, Deque<Exercise>> byGroup = new LinkedHashMap<>();
        for (MuscleGroup g : usable) {
            byGroup.put(g, new ArrayDeque<>());
        }
        for (Exercise ex : pool) {
            Deque<Exercise> q = byGroup.get(ex.getMuscleGroup());
            if (q != null) q.add(ex);
        }

        List<Exercise> picked = new ArrayList<>();
        Set<Long> used = new HashSet<>();
        while (picked.size() < targetCount) {
            boolean added = false;
            for (MuscleGroup g : usable) {
                if (picked.size() >= targetCount) break;
                Deque<Exercise> q = byGroup.get(g);
                while (q != null && !q.isEmpty()) {
                    Exercise ex = q.poll();
                    if (used.add(ex.getId())) {
                        picked.add(ex);
                        added = true;
                        break;
                    }
                }
            }
            if (!added) break;
        }

        if ("FAT_LOSS".equals(focus) && picked.stream().noneMatch(e -> e.getMuscleGroup() == MuscleGroup.CARDIO)) {
            catalog.stream()
                    .filter(e -> e.getMuscleGroup() == MuscleGroup.CARDIO)
                    .findFirst()
                    .ifPresent(cardio -> {
                        if (picked.size() >= targetCount && !picked.isEmpty()) {
                            picked.set(picked.size() - 1, cardio);
                        } else if (!used.contains(cardio.getId())) {
                            picked.add(cardio);
                        }
                    });
        }

        List<RoutineExerciseResponse> result = new ArrayList<>();
        int order = 0;
        for (Exercise ex : picked) {
            boolean cardio = ex.getMuscleGroup() == MuscleGroup.CARDIO;
            result.add(new RoutineExerciseResponse(
                    null,
                    ex.getId(),
                    ex.getName(),
                    ex.getImageUrl(),
                    cardio ? Math.max(1, schema.sets() - 1) : schema.sets(),
                    cardio ? Math.max(schema.reps(), 15) : schema.reps(),
                    null,
                    cardio ? 600 : null,
                    order == 0 ? "Prioridad del día" : null,
                    order++
            ));
        }
        return result;
    }

    private boolean matchesLevel(Exercise ex, String level) {
        if (level == null) return true;
        String n = level.toLowerCase(Locale.ROOT);
        if (n.startsWith("princ")) {
            return ex.getDifficulty() == ExerciseDifficulty.BASIC;
        }
        if (n.startsWith("avanz")) {
            return true;
        }
        // Intermedio: prefer BASIC but allow ADVANCED
        return true;
    }

    private boolean matchesEquipment(Exercise ex, String equipment) {
        if (equipment == null || "FULL_GYM".equals(equipment)) return true;
        String name = ex.getName().toLowerCase(Locale.ROOT);
        if ("BODYWEIGHT".equals(equipment)) {
            return name.contains("peso corporal") || name.contains("plancha") || name.contains("fondos")
                    || name.contains("dominada") || name.contains("burpee") || name.contains("sentadilla libre")
                    || name.contains("abdominal") || name.contains("crunch") || name.contains("mountain")
                    || name.contains("jumping") || name.contains("zancada") || ex.getMuscleGroup() == MuscleGroup.CARDIO
                    || ex.getMuscleGroup() == MuscleGroup.ABS;
        }
        // MACHINES_DUMBBELLS: avoid barbell-heavy if obvious
        return !name.contains("barra olímpica") && !name.contains("peso muerto convencional");
    }

    private Set<MuscleGroup> avoidGroupsFromInjuries(String injuries) {
        if (injuries == null || injuries.isBlank()) return Set.of();
        String t = injuries.toLowerCase(Locale.ROOT);
        Set<MuscleGroup> avoid = new HashSet<>();
        if (t.contains("hombro") || t.contains("manguito")) {
            avoid.add(MuscleGroup.SHOULDER);
        }
        if (t.contains("rodilla")) {
            avoid.add(MuscleGroup.QUADRICEPS);
            avoid.add(MuscleGroup.CALF);
        }
        if (t.contains("lumbar") || t.contains("espalda baja") || t.contains("hernia")) {
            avoid.add(MuscleGroup.TRAPEZIUS);
        }
        if (t.contains("codo")) {
            avoid.add(MuscleGroup.BICEP);
            avoid.add(MuscleGroup.TRICEP);
        }
        if (t.contains("muñeca") || t.contains("muneca")) {
            avoid.add(MuscleGroup.FOREARM);
        }
        return avoid;
    }

    private SetsReps setsRepsFor(String focus, String level) {
        boolean beginner = level != null && level.toLowerCase(Locale.ROOT).startsWith("princ");
        return switch (focus) {
            case "STRENGTH" -> new SetsReps(beginner ? 3 : 4, beginner ? 6 : 5);
            case "FAT_LOSS", "TONE" -> new SetsReps(3, beginner ? 12 : 15);
            case "HYPERTROPHY" -> new SetsReps(beginner ? 3 : 4, 10);
            default -> new SetsReps(3, 12);
        };
    }

    private int exercisesForSession(int minutes, String level) {
        boolean beginner = level != null && level.toLowerCase(Locale.ROOT).startsWith("princ");
        if (minutes <= 45) return beginner ? 4 : 5;
        if (minutes <= 60) return beginner ? 5 : 6;
        return beginner ? 6 : 7;
    }

    private String normalizeFocus(String focus) {
        if (focus == null || focus.isBlank()) return "GENERAL";
        return switch (focus.trim().toUpperCase(Locale.ROOT)) {
            case "HYPERTROPHY", "HIPERTROFIA" -> "HYPERTROPHY";
            case "STRENGTH", "FUERZA" -> "STRENGTH";
            case "FAT_LOSS", "QUEMAR", "DEFINICION", "DEFINICIÓN" -> "FAT_LOSS";
            case "TONE", "TONIFICACION", "TONIFICACIÓN" -> "TONE";
            default -> "GENERAL";
        };
    }

    private String focusLabel(String focus) {
        return switch (focus) {
            case "HYPERTROPHY" -> "Hipertrofia";
            case "STRENGTH" -> "Fuerza";
            case "FAT_LOSS" -> "Quema de grasa";
            case "TONE" -> "Tonificación";
            default -> "Salud general";
        };
    }

    private String buildNotes(String goals, String injuries, String level, int sessionMinutes) {
        StringBuilder sb = new StringBuilder();
        if (goals != null && !goals.isBlank()) sb.append("Objetivos: ").append(goals.trim());
        if (injuries != null && !injuries.isBlank()) {
            if (!sb.isEmpty()) sb.append('\n');
            sb.append("Precauciones: ").append(injuries.trim());
        }
        if (!sb.isEmpty()) sb.append('\n');
        sb.append("Nivel: ").append(level).append(". Sesión aprox. ").append(sessionMinutes).append(" min.");
        return sb.toString();
    }

    private String buildSummary(int days, String focus, String level, String equipment,
                                String injuries, Set<MuscleGroup> avoid) {
        StringBuilder sb = new StringBuilder();
        sb.append("Plan ").append(days).append(" días · ").append(focusLabel(focus))
                .append(" · ").append(level);
        if ("BODYWEIGHT".equals(equipment)) sb.append(" · peso corporal");
        else if ("MACHINES_DUMBBELLS".equals(equipment)) sb.append(" · máquinas/mancuernas");
        if (!avoid.isEmpty()) {
            sb.append(". Adaptado por lesiones reportadas.");
        } else if (injuries != null && !injuries.isBlank()) {
            sb.append(". Revisar precauciones en notas.");
        }
        return sb.toString();
    }

    private static String firstNonBlank(String... values) {
        if (values == null) return null;
        for (String v : values) {
            if (v != null && !v.isBlank()) return v.trim();
        }
        return null;
    }

    private static String blankToNull(String v) {
        return v == null || v.isBlank() ? null : v.trim();
    }

    private record SetsReps(int sets, int reps) {}

    private record MemberContext(
            User member,
            Integer age,
            String sex,
            String level,
            String goals,
            String injuries,
            boolean levelFromForm,
            boolean injuriesFromForm,
            boolean goalsFromProfileOrForm
    ) {}
}
