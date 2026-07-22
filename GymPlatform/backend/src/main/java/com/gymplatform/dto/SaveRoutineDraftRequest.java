package com.gymplatform.dto;

import com.gymplatform.domain.enums.RoutineValidityUnit;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

/** Borrador de rutina para una solicitud (estado En progreso). Los días pueden ir vacíos. */
public record SaveRoutineDraftRequest(
        @NotBlank String name,
        String description,
        String notes,
        Integer daysPerWeek,
        boolean temporary,
        @Min(1) Integer validityAmount,
        RoutineValidityUnit validityUnit,
        @Valid List<SaveRoutineDraftDayRequest> days
) {}
