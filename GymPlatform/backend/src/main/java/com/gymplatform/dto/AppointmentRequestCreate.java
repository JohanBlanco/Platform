package com.gymplatform.dto;

import com.gymplatform.domain.enums.AppointmentType;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record AppointmentRequestCreate(
        @NotNull AppointmentType type,
        String notes,
        Long preferredStaffId,
        Instant scheduledStart,
        Instant scheduledEnd,
        Long openAppointmentId,
        Long memberId
) {}
