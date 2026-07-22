package com.gymplatform.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record ActivityResponse(
        Long id,
        String name,
        String description,
        String imageUrl,
        LocalDate activityDate,
        LocalDate startDate,
        LocalDate endDate,
        boolean recurring,
        List<String> repeatDays,
        LocalTime startTime,
        LocalTime endTime,
        String locationName,
        Long instructorId,
        String instructorName,
        Integer capacity,
        long confirmedReservations,
        boolean hasCapacity,
        boolean hasOccurrenceOverride,
        boolean allDay,
        boolean active,
        boolean occurrenceCancelled,
        Instant createdAt
) {}
