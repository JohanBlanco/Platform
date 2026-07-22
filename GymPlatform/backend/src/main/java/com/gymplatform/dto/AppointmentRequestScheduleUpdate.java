package com.gymplatform.dto;

import java.time.Instant;

public record AppointmentRequestScheduleUpdate(
        Instant scheduledStart,
        Instant scheduledEnd,
        Long assignedStaffId
) {}
