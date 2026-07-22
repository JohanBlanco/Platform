package com.gymplatform.dto;

import com.gymplatform.domain.enums.RoutineValidityUnit;
import java.time.LocalDate;
import java.util.List;

public record RoutineResponse(
        Long id,
        String name,
        String description,
        String notes,
        Long memberId,
        String memberName,
        Long instructorId,
        String instructorName,
        Long templateId,
        boolean temporary,
        Integer daysPerWeek,
        LocalDate validFrom,
        LocalDate validUntil,
        Integer validityAmount,
        RoutineValidityUnit validityUnit,
        boolean expired,
        List<RoutineDayResponse> days,
        List<RoutineExerciseResponse> exercises
) {}
