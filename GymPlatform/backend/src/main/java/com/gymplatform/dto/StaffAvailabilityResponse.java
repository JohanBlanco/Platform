package com.gymplatform.dto;

public record StaffAvailabilityResponse(
        Long id,
        Long staffId,
        String staffName,
        String availabilityDate,
        String startTime,
        String endTime,
        Integer slotDurationMinutes
) {}
