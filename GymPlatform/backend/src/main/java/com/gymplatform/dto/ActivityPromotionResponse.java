package com.gymplatform.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record ActivityPromotionResponse(
        int slotIndex,
        boolean populated,
        boolean manual,
        Long activityId,
        String name,
        String description,
        String imageUrl,
        LocalDate nextOccurrenceDate,
        LocalTime startTime,
        LocalTime endTime,
        String locationName,
        String instructorName,
        long reservationCount
) {}
