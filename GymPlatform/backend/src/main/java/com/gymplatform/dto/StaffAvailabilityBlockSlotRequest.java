package com.gymplatform.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalTime;

public record StaffAvailabilityBlockSlotRequest(
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime
) {}
