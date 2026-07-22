package com.gymplatform.dto;

public record StaffAvailabilityRangeResponse(
        int daysCreated,
        int daysSkipped,
        int slotsPerDay,
        int appointmentsCreated
) {}
