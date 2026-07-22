package com.gymplatform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public record ActivityOccurrenceEditRequest(
        @NotNull LocalDate occurrenceDate,
        @NotNull LocalTime startTime,
        LocalTime endTime,
        String locationName,
        Integer capacity,
        /** OCCURRENCE = solo esta fecha; SERIES = toda la serie */
        @NotBlank String scope,
        Boolean confirmAffectedReservations
) {}
