package com.gymplatform.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CashCountLineRequest(
        @NotNull @Min(1) Integer valueColones,
        @Min(0) int quantity
) {}
