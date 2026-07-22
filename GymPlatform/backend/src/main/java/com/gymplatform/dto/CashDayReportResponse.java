package com.gymplatform.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Ventas del día agrupadas por cada apertura de caja.
 * El resumen del día es la suma de todas las cajas.
 */
public record CashDayReportResponse(
        LocalDate date,
        StoreSalesSummaryResponse daySummary,
        List<CashSessionDayBlockResponse> sessions
) {}
