package com.gymplatform.dto;

import com.gymplatform.domain.enums.ReservationStatus;
import java.time.Instant;
import java.time.LocalDate;

public record ReservationResponse(
        Long id,
        Long activityId,
        String activityName,
        LocalDate occurrenceDate,
        Long memberId,
        String memberName,
        ReservationStatus status,
        boolean freeSlot,
        boolean paymentRequired,
        boolean paid,
        boolean attended,
        Instant createdAt
) {}
