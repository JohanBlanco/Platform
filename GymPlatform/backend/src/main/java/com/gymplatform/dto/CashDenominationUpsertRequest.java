package com.gymplatform.dto;

import com.gymplatform.domain.enums.CashDenominationKind;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CashDenominationUpsertRequest(
        Long id,
        @Min(1) int valueColones,
        @NotNull CashDenominationKind kind,
        int sortOrder,
        boolean active
) {}
