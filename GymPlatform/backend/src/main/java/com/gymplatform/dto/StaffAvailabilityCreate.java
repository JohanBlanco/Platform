package com.gymplatform.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public record StaffAvailabilityCreate(
        @NotNull LocalDate availabilityDate,
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,
        Integer slotDurationMinutes
) {}
