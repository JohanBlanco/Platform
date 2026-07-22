package com.gymplatform.dto;

import com.gymplatform.domain.enums.ReservationStatus;
import java.time.LocalDate;
import java.util.List;

public record ActivityReservationImpactResponse(
        long activeReservations,
        long affectedReservations,
        List<AffectedReservationItem> items
) {
    public record AffectedReservationItem(
            Long reservationId,
            LocalDate occurrenceDate,
            String memberName,
            ReservationStatus status
    ) {}
}
