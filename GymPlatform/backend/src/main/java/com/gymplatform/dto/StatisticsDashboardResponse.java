package com.gymplatform.dto;

import java.math.BigDecimal;
import java.util.List;

public record StatisticsDashboardResponse(
        String period,
        String date,
        String periodLabel,
        Kpis kpis,
        Kpis previousKpis,
        List<TimePoint> timeSeries,
        List<NamedAmount> byCategory,
        List<NamedAmount> topProducts,
        List<NamedAmount> incomeVsExpense,
        List<NamedAmount> byPaymentMethod
) {
    public record Kpis(
            BigDecimal incomeTotal,
            BigDecimal expenseTotal,
            BigDecimal salesTotal,
            BigDecimal netTotal,
            BigDecimal averageTicket,
            int saleCount,
            BigDecimal incomeChangePct,
            BigDecimal expenseChangePct,
            BigDecimal netChangePct
    ) {}

    public record TimePoint(String key, String label, BigDecimal income, BigDecimal expense, BigDecimal sales) {}

    public record NamedAmount(String name, BigDecimal amount, int count) {}
}
