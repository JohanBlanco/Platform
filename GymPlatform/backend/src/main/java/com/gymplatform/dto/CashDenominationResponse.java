package com.gymplatform.dto;

import com.gymplatform.domain.enums.CashDenominationKind;

public record CashDenominationResponse(
        Long id,
        int valueColones,
        CashDenominationKind kind,
        int sortOrder,
        boolean active
) {}
