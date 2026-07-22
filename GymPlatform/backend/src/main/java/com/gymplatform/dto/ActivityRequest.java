package com.gymplatform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record ActivityRequest(
        @NotBlank String name,
        String description,
        String imageUrl,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @NotNull LocalTime startTime,
        LocalTime endTime,
        String locationName,
        Long instructorId,
        Integer capacity,
        boolean recurring,
        List<String> repeatDays,
        boolean allDay,
        Boolean confirmAffectedReservations
) {}
