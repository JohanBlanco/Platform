package com.gymplatform.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record ProductOfferUpdateRequest(
        @NotNull @Min(1) @Max(90) Integer offerPercent,
        @Size(max = 40) String offerBadge,
        LocalDate offerFrom,
        LocalDate offerUntil
) {}
