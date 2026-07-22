package com.gymplatform.dto;

import java.math.BigDecimal;

public record StoreSalesSummaryResponse(
        BigDecimal salesTotal,
        BigDecimal incomeTotal,
        BigDecimal expenseTotal,
        BigDecimal netTotal,
        int saleCount
) {}
