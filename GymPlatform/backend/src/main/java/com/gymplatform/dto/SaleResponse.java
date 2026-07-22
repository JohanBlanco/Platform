package com.gymplatform.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record SaleResponse(
        Long id,
        String memberName,
        String activityName,
        String concept,
        BigDecimal amount,
        Instant paidAt
) {}
