package com.gymplatform.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record CashSettingsUpdateRequest(
        @NotNull @DecimalMin("0") BigDecimal openingFloatColones,
        @NotNull @DecimalMin("0") @DecimalMax("100") BigDecimal systemIvaPercent,
        @NotNull @Valid List<CashDenominationUpsertRequest> denominations
) {}
