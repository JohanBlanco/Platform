package com.gymplatform.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

/** Día de borrador: puede quedar sin ejercicios aún. */
public record SaveRoutineDraftDayRequest(
        @NotBlank String dayLabel,
        int dayNumber,
        @Valid List<RoutineExerciseRequest> exercises
) {}
