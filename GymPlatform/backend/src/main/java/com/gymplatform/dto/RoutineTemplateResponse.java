package com.gymplatform.dto;

import java.util.List;

public record RoutineTemplateResponse(
        Long id,
        String name,
        String description,
        String goal,
        Long instructorId,
        Integer daysPerWeek,
        List<RoutineDayResponse> days,
        List<RoutineExerciseResponse> exercises
) {}
