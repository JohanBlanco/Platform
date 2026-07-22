package com.gymplatform.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalTime;

public record StaffAvailabilityUpdate(
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,
        Integer slotDurationMinutes,
        Boolean cancelAffectedReserved
) {}
