package com.gymplatform.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public record StaffAvailabilityRangeUpdate(
        @NotNull LocalDate startDate,
        LocalDate endDate,
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,
        Integer slotDurationMinutes,
        Boolean cancelAffectedReserved
) {}
