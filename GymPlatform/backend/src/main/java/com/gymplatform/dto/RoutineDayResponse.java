package com.gymplatform.dto;

import java.util.List;

public record RoutineDayResponse(
        Long id,
        int dayNumber,
        String dayLabel,
        int orderIndex,
        List<RoutineExerciseResponse> exercises
) {}
