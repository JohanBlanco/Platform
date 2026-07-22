package com.gymplatform.dto;

import com.gymplatform.domain.enums.RoutineValidityUnit;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record AssignTemplateRequest(
        Long templateId,
        List<Long> memberIds,
        @NotNull @Min(1) Integer validityAmount,
        @NotNull RoutineValidityUnit validityUnit
) {}
