package com.gymplatform.dto;

import com.gymplatform.domain.enums.RoutineValidityUnit;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CreateRoutineRequest(
        @NotBlank String name,
        String description,
        String notes,
        Long memberId,
        Long templateId,
        Long routineRequestId,
        Integer daysPerWeek,
        boolean temporary,
        @NotNull @Min(1) Integer validityAmount,
        @NotNull RoutineValidityUnit validityUnit,
        List<RoutineDayRequest> days,
        List<RoutineExerciseRequest> exercises
) {}
