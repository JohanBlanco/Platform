package com.gymplatform.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record RoutineDayRequest(
        @NotBlank String dayLabel,
        int dayNumber,
        @NotEmpty @Valid List<RoutineExerciseRequest> exercises
) {}
