package com.gymplatform.util;

import com.gymplatform.domain.entity.Product;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

public final class ProductOfferUtils {

    private ProductOfferUtils() {}

    public static boolean isOfferActive(Product product) {
        if (product == null) return false;
        Integer percent = product.getOfferPercent();
        if (percent == null || percent <= 0) return false;
        LocalDate today = LocalDate.now();
        if (product.getOfferFrom() != null && today.isBefore(product.getOfferFrom())) {
            return false;
        }
        if (product.getOfferUntil() != null && today.isAfter(product.getOfferUntil())) {
            return false;
        }
        return true;
    }

    public static String resolveBadge(Product product) {
        if (!isOfferActive(product)) return null;
        String badge = product.getOfferBadge();
        if (badge != null && !badge.isBlank()) {
            return badge.trim();
        }
        return product.getOfferPercent() + "% OFF";
    }

    public static BigDecimal applyOffer(BigDecimal price, Product product) {
        if (price == null) return BigDecimal.ZERO;
        if (!isOfferActive(product)) {
            return price.setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal factor = BigDecimal.valueOf(100 - product.getOfferPercent())
                .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
        return price.multiply(factor).setScale(2, RoundingMode.HALF_UP);
    }
}
