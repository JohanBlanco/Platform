package com.gymplatform.dto;

import com.gymplatform.domain.enums.StoreSaleType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record StoreManualEntryRequest(
        @NotNull StoreSaleType type,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        @NotBlank String notes
) {}
