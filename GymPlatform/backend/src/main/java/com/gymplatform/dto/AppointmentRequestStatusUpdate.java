package com.gymplatform.dto;

import com.gymplatform.domain.enums.AppointmentRequestStatus;
import jakarta.validation.constraints.NotNull;

public record AppointmentRequestStatusUpdate(
        @NotNull AppointmentRequestStatus status
) {}
