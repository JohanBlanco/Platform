package com.gymplatform.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CashSessionOpenRequest(
        @NotNull @Valid List<CashCountLineRequest> counts,
        String notes
) {}
