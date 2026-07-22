package com.gymplatform.dto;

import java.time.Instant;

public record AppointmentRequestResponse(
        Long id,
        Long memberId,
        String memberName,
        String type,
        String notes,
        String status,
        Long preferredStaffId,
        String preferredStaffName,
        Long assignedStaffId,
        String assignedStaffName,
        Long staffAvailabilityId,
        String scheduledStart,
        String scheduledEnd,
        String createdAt
) {}
