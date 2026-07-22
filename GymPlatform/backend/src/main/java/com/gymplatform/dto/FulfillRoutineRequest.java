package com.gymplatform.dto;

import com.gymplatform.domain.enums.RoutineValidityUnit;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record FulfillRoutineRequest(
        @NotBlank String name,
        String description,
        String notes,
        Integer daysPerWeek,
        boolean temporary,
        @NotNull @Min(1) Integer validityAmount,
        @NotNull RoutineValidityUnit validityUnit,
        @NotEmpty @Valid List<RoutineDayRequest> days
) {}
