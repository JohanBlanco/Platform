package com.gymplatform.dto;

import java.util.List;

/** Una apertura/cierre de caja del día con sus movimientos. */
public record CashSessionDayBlockResponse(
        CashSessionResponse session,
        StoreSalesSummaryResponse summary,
        List<StoreSaleResponse> sales
) {}
