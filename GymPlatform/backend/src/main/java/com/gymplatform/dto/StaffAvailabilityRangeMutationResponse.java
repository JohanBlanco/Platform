package com.gymplatform.dto;

public record StaffAvailabilityRangeMutationResponse(
        int daysAffected,
        int appointmentsCreated
) {}
