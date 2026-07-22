package com.gymplatform.service;

import com.gymplatform.domain.entity.Product;
import com.gymplatform.domain.entity.ProductCategory;
import com.gymplatform.domain.enums.PaymentMethod;
import com.gymplatform.domain.enums.StoreSaleItemKind;
import com.gymplatform.domain.enums.StoreSaleType;
import com.gymplatform.dto.StatisticsDashboardResponse;
import com.gymplatform.dto.StatisticsDashboardResponse.Kpis;
import com.gymplatform.dto.StatisticsDashboardResponse.NamedAmount;
import com.gymplatform.dto.StatisticsDashboardResponse.TimePoint;
import com.gymplatform.dto.StoreSaleItemResponse;
import com.gymplatform.dto.StoreSalePaymentResponse;
import com.gymplatform.dto.StoreSaleResponse;
import com.gymplatform.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class StatisticsDashboardService {

    private static final Locale LOCALE_ES = Locale.forLanguageTag("es-CR");
    private static final DateTimeFormatter DAY_LABEL = DateTimeFormatter.ofPattern("d MMM", LOCALE_ES);
    private static final DateTimeFormatter MONTH_LABEL = DateTimeFormatter.ofPattern("MMM", LOCALE_ES);

    private final StoreSaleService storeSaleService;
    private final ProductRepository productRepository;
    private final StatisticsAccessService statisticsAccessService;

    public StatisticsDashboardService(
            StoreSaleService storeSaleService,
            ProductRepository productRepository,
            StatisticsAccessService statisticsAccessService) {
        this.storeSaleService = storeSaleService;
        this.productRepository = productRepository;
        this.statisticsAccessService = statisticsAccessService;
    }

    @Transactional(readOnly = true)
    public StatisticsDashboardResponse getDashboard(
            Long organizationId,
            String period,
            LocalDate date,
            String unlockToken) {
        statisticsAccessService.requireValidUnlock(organizationId, unlockToken);

        String p = period == null ? "month" : period.toLowerCase();
        LocalDate anchor = date != null ? date : LocalDate.now();
        LocalDate previousAnchor = previousAnchor(p, anchor);

        List<StoreSaleResponse> current = storeSaleService.listSales(organizationId, p, anchor);
        List<StoreSaleResponse> previous = storeSaleService.listSales(organizationId, p, previousAnchor);

        Map<Long, String> productCategory = loadProductPrimaryCategory(organizationId, current);

        Kpis currentKpis = buildKpis(current, null);
        Kpis previousKpis = buildKpis(previous, null);
        Kpis kpis = buildKpis(current, previousKpis);

        return new StatisticsDashboardResponse(
                p,
                anchor.toString(),
                periodLabel(p, anchor),
                kpis,
                previousKpis,
                buildTimeSeries(p, anchor, current),
                buildByCategory(current, productCategory),
                buildTopProducts(current),
                buildIncomeVsExpense(currentKpis),
                buildByPaymentMethod(current)
        );
    }

    private LocalDate previousAnchor(String period, LocalDate anchor) {
        return switch (period) {
            case "day" -> anchor.minusDays(1);
            case "year" -> anchor.minusYears(1);
            default -> anchor.minusMonths(1);
        };
    }

    private String periodLabel(String period, LocalDate anchor) {
        return switch (period) {
            case "day" -> "Día " + DAY_LABEL.format(anchor);
            case "year" -> "Año " + anchor.getYear();
            default -> {
                String month = anchor.getMonth().getDisplayName(TextStyle.FULL, LOCALE_ES);
                yield Character.toUpperCase(month.charAt(0)) + month.substring(1) + " " + anchor.getYear();
            }
        };
    }

    private Kpis buildKpis(List<StoreSaleResponse> sales, Kpis previous) {
        BigDecimal salesTotal = BigDecimal.ZERO;
        BigDecimal incomeTotal = BigDecimal.ZERO;
        BigDecimal expenseTotal = BigDecimal.ZERO;
        int saleCount = 0;

        for (StoreSaleResponse sale : sales) {
            if (sale.type() == StoreSaleType.SALE) {
                salesTotal = salesTotal.add(n(sale.total()));
                saleCount++;
            } else if (sale.type() == StoreSaleType.MANUAL_INCOME) {
                incomeTotal = incomeTotal.add(n(sale.total()));
            } else if (sale.type() == StoreSaleType.MANUAL_EXPENSE) {
                expenseTotal = expenseTotal.add(n(sale.total()));
            }
        }
        // Ingresos = ventas + ingresos manuales
        BigDecimal totalIncome = salesTotal.add(incomeTotal);
        BigDecimal net = totalIncome.subtract(expenseTotal);
        BigDecimal avgTicket = saleCount > 0
                ? salesTotal.divide(BigDecimal.valueOf(saleCount), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        BigDecimal incomeChange = previous == null ? BigDecimal.ZERO
                : pctChange(totalIncome, previous.incomeTotal());
        BigDecimal expenseChange = previous == null ? BigDecimal.ZERO
                : pctChange(expenseTotal, previous.expenseTotal());
        BigDecimal netChange = previous == null ? BigDecimal.ZERO
                : pctChange(net, previous.netTotal());

        return new Kpis(
                totalIncome,
                expenseTotal,
                salesTotal,
                net,
                avgTicket,
                saleCount,
                incomeChange,
                expenseChange,
                netChange
        );
    }

    private BigDecimal pctChange(BigDecimal current, BigDecimal previous) {
        BigDecimal prev = n(previous);
        BigDecimal cur = n(current);
        if (prev.compareTo(BigDecimal.ZERO) == 0) {
            if (cur.compareTo(BigDecimal.ZERO) == 0) {
                return BigDecimal.ZERO;
            }
            return BigDecimal.valueOf(100);
        }
        return cur.subtract(prev)
                .multiply(BigDecimal.valueOf(100))
                .divide(prev, 1, RoundingMode.HALF_UP);
    }

    private List<TimePoint> buildTimeSeries(String period, LocalDate anchor, List<StoreSaleResponse> sales) {
        ZoneId zone = ZoneId.systemDefault();
        Map<String, Agg> buckets = new LinkedHashMap<>();

        if ("day".equals(period)) {
            for (int h = 0; h < 24; h++) {
                String key = String.format("%02d", h);
                buckets.put(key, new Agg());
            }
            for (StoreSaleResponse sale : sales) {
                int hour = sale.createdAt().atZone(zone).getHour();
                String key = String.format("%02d", hour);
                addSaleToAgg(buckets.get(key), sale);
            }
            List<TimePoint> points = new ArrayList<>();
            for (Map.Entry<String, Agg> e : buckets.entrySet()) {
                Agg a = e.getValue();
                points.add(new TimePoint(e.getKey(), e.getKey() + ":00", a.income, a.expense, a.sales));
            }
            return points;
        }

        if ("year".equals(period)) {
            for (int m = 1; m <= 12; m++) {
                String key = String.format("%02d", m);
                buckets.put(key, new Agg());
            }
            for (StoreSaleResponse sale : sales) {
                int month = sale.createdAt().atZone(zone).getMonthValue();
                String key = String.format("%02d", month);
                addSaleToAgg(buckets.get(key), sale);
            }
            List<TimePoint> points = new ArrayList<>();
            for (int m = 1; m <= 12; m++) {
                String key = String.format("%02d", m);
                Agg a = buckets.get(key);
                LocalDate labelDate = LocalDate.of(anchor.getYear(), m, 1);
                points.add(new TimePoint(key, MONTH_LABEL.format(labelDate), a.income, a.expense, a.sales));
            }
            return points;
        }

        // month → each day
        YearMonth ym = YearMonth.from(anchor);
        int days = ym.lengthOfMonth();
        for (int d = 1; d <= days; d++) {
            String key = String.format("%02d", d);
            buckets.put(key, new Agg());
        }
        for (StoreSaleResponse sale : sales) {
            int day = sale.createdAt().atZone(zone).getDayOfMonth();
            String key = String.format("%02d", day);
            Agg agg = buckets.get(key);
            if (agg != null) {
                addSaleToAgg(agg, sale);
            }
        }
        List<TimePoint> points = new ArrayList<>();
        for (int d = 1; d <= days; d++) {
            String key = String.format("%02d", d);
            Agg a = buckets.get(key);
            LocalDate dayDate = ym.atDay(d);
            points.add(new TimePoint(key, DAY_LABEL.format(dayDate), a.income, a.expense, a.sales));
        }
        return points;
    }

    private void addSaleToAgg(Agg agg, StoreSaleResponse sale) {
        if (sale.type() == StoreSaleType.SALE) {
            agg.sales = agg.sales.add(n(sale.total()));
            agg.income = agg.income.add(n(sale.total()));
        } else if (sale.type() == StoreSaleType.MANUAL_INCOME) {
            agg.income = agg.income.add(n(sale.total()));
        } else if (sale.type() == StoreSaleType.MANUAL_EXPENSE) {
            agg.expense = agg.expense.add(n(sale.total()));
        }
    }

    private List<NamedAmount> buildByCategory(
            List<StoreSaleResponse> sales,
            Map<Long, String> productCategory) {
        Map<String, AggCount> map = new LinkedHashMap<>();
        for (StoreSaleResponse sale : sales) {
            if (sale.type() != StoreSaleType.SALE) {
                continue;
            }
            for (StoreSaleItemResponse item : sale.items()) {
                String cat = resolveCategory(item, productCategory);
                AggCount agg = map.computeIfAbsent(cat, k -> new AggCount());
                agg.amount = agg.amount.add(n(item.lineTotal()));
                agg.count += item.quantity();
            }
        }
        return toNamedSorted(map);
    }

    private String resolveCategory(StoreSaleItemResponse item, Map<Long, String> productCategory) {
        if (item.kind() == StoreSaleItemKind.MEMBERSHIP) {
            return "Membresías";
        }
        if (item.kind() == StoreSaleItemKind.MANUAL) {
            return "Otros";
        }
        if (item.productId() != null) {
            String name = productCategory.get(item.productId());
            if (name != null && !name.isBlank()) {
                return name;
            }
        }
        return "Sin categoría";
    }

    private List<NamedAmount> buildTopProducts(List<StoreSaleResponse> sales) {
        Map<String, AggCount> map = new LinkedHashMap<>();
        for (StoreSaleResponse sale : sales) {
            if (sale.type() != StoreSaleType.SALE) {
                continue;
            }
            for (StoreSaleItemResponse item : sale.items()) {
                String name = item.description() != null && !item.description().isBlank()
                        ? item.description()
                        : "Producto";
                AggCount agg = map.computeIfAbsent(name, k -> new AggCount());
                agg.amount = agg.amount.add(n(item.lineTotal()));
                agg.count += item.quantity();
            }
        }
        return map.entrySet().stream()
                .sorted((a, b) -> b.getValue().amount.compareTo(a.getValue().amount))
                .limit(8)
                .map(e -> new NamedAmount(e.getKey(), e.getValue().amount, e.getValue().count))
                .toList();
    }

    private List<NamedAmount> buildIncomeVsExpense(Kpis kpis) {
        return List.of(
                new NamedAmount("Ingresos", kpis.incomeTotal(), 0),
                new NamedAmount("Gastos", kpis.expenseTotal(), 0)
        );
    }

    private List<NamedAmount> buildByPaymentMethod(List<StoreSaleResponse> sales) {
        Map<String, AggCount> map = new LinkedHashMap<>();
        map.put("Efectivo", new AggCount());
        map.put("Tarjeta", new AggCount());
        map.put("SINPE", new AggCount());

        for (StoreSaleResponse sale : sales) {
            if (sale.type() != StoreSaleType.SALE) {
                continue;
            }
            if (sale.payments() != null && !sale.payments().isEmpty()) {
                for (StoreSalePaymentResponse pay : sale.payments()) {
                    String label = paymentLabel(pay.method());
                    AggCount agg = map.computeIfAbsent(label, k -> new AggCount());
                    agg.amount = agg.amount.add(n(pay.amount()));
                    agg.count++;
                }
            } else {
                String label = paymentLabel(sale.paymentMethod());
                AggCount agg = map.computeIfAbsent(label, k -> new AggCount());
                agg.amount = agg.amount.add(n(sale.total()));
                agg.count++;
            }
        }
        return map.entrySet().stream()
                .filter(e -> e.getValue().amount.compareTo(BigDecimal.ZERO) > 0)
                .map(e -> new NamedAmount(e.getKey(), e.getValue().amount, e.getValue().count))
                .toList();
    }

    private String paymentLabel(PaymentMethod method) {
        if (method == null) {
            return "Efectivo";
        }
        return switch (method) {
            case CARD -> "Tarjeta";
            case SINPE -> "SINPE";
            default -> "Efectivo";
        };
    }

    private Map<Long, String> loadProductPrimaryCategory(Long orgId, List<StoreSaleResponse> sales) {
        Set<Long> productIds = new HashSet<>();
        for (StoreSaleResponse sale : sales) {
            if (sale.items() == null) {
                continue;
            }
            for (StoreSaleItemResponse item : sale.items()) {
                if (item.productId() != null) {
                    productIds.add(item.productId());
                }
            }
        }
        if (productIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, String> result = new HashMap<>();
        for (Product product : productRepository.findByIdsWithCategories(productIds)) {
            if (product.getOrganization() != null
                    && !orgId.equals(product.getOrganization().getId())) {
                continue;
            }
            String catName = product.getCategories().stream()
                    .findFirst()
                    .map(ProductCategory::getName)
                    .orElse("Sin categoría");
            result.put(product.getId(), catName);
        }
        return result;
    }

    private List<NamedAmount> toNamedSorted(Map<String, AggCount> map) {
        return map.entrySet().stream()
                .sorted((a, b) -> b.getValue().amount.compareTo(a.getValue().amount))
                .map(e -> new NamedAmount(e.getKey(), e.getValue().amount, e.getValue().count))
                .toList();
    }

    private static BigDecimal n(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private static final class Agg {
        BigDecimal income = BigDecimal.ZERO;
        BigDecimal expense = BigDecimal.ZERO;
        BigDecimal sales = BigDecimal.ZERO;
    }

    private static final class AggCount {
        BigDecimal amount = BigDecimal.ZERO;
        int count;
    }
}
