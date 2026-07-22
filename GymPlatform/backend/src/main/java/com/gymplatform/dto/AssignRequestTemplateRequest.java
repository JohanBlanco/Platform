package com.gymplatform.dto;

import com.gymplatform.domain.enums.RoutineValidityUnit;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record AssignRequestTemplateRequest(
        @NotNull Long templateId,
        @NotNull @Min(1) Integer validityAmount,
        @NotNull RoutineValidityUnit validityUnit
) {}
