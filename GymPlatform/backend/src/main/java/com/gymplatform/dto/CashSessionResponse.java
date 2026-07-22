package com.gymplatform.dto;

import com.gymplatform.domain.enums.CashSessionStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record CashSessionResponse(
        Long id,
        CashSessionStatus status,
        Instant openedAt,
        Instant closedAt,
        String openedByName,
        String closedByName,
        BigDecimal openingTotal,
        BigDecimal closingTotal,
        BigDecimal expectedClosingTotal,
        BigDecimal salesNetTotal,
        String notes,
        List<CashCountLineResponse> openingCounts,
        List<CashCountLineResponse> closingCounts
) {}
