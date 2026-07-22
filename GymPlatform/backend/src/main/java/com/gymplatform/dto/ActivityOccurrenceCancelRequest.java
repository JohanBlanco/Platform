package com.gymplatform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record ActivityOccurrenceCancelRequest(
        @NotNull LocalDate occurrenceDate,
        /** OCCURRENCE = solo esta fecha; SERIES = toda la serie */
        @NotBlank String scope,
        Boolean cancelReservations
) {}
