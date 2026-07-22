package com.gymplatform.dto;

import java.time.LocalDate;

public record ReservationCreateRequest(
        Boolean payAtReception,
        LocalDate occurrenceDate
) {}
