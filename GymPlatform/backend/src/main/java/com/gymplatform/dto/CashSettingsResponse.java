package com.gymplatform.dto;

import java.math.BigDecimal;
import java.util.List;

public record CashSettingsResponse(
        BigDecimal openingFloatColones,
        BigDecimal systemIvaPercent,
        List<CashDenominationResponse> denominations
) {}
