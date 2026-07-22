package com.gymplatform.dto;

import com.gymplatform.domain.enums.RoutineRequestStatus;
import jakarta.validation.constraints.NotNull;

public record RoutineRequestStatusUpdate(
        @NotNull RoutineRequestStatus status
) {}
