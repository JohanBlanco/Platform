package com.gymplatform.util;

import com.gymplatform.dto.PriceAddonRequest;
import com.gymplatform.dto.PriceAddonResponse;
import com.gymplatform.exception.BusinessException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

public final class PriceAddonUtils {

    public static final BigDecimal DEFAULT_IVA_PERCENT = new BigDecimal("13");
    public static final String IVA_NAME = "I.V.A.";

    private PriceAddonUtils() {}

    public static BigDecimal applyIva(BigDecimal base, boolean applyIva, BigDecimal ivaPercent) {
        BigDecimal safeBase = base != null ? base : BigDecimal.ZERO;
        if (!applyIva) {
            return safeBase.setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal percent = ivaPercent != null ? ivaPercent : DEFAULT_IVA_PERCENT;
        if (percent.compareTo(BigDecimal.ZERO) <= 0) {
            return safeBase.setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal amount = safeBase.multiply(percent)
                .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
        return safeBase.add(amount).setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal ivaAmount(BigDecimal base, boolean applyIva, BigDecimal ivaPercent) {
        BigDecimal safeBase = base != null ? base : BigDecimal.ZERO;
        return applyIva(safeBase, applyIva, ivaPercent).subtract(safeBase.setScale(2, RoundingMode.HALF_UP));
    }

    public static void validateIva(Boolean applyIva, BigDecimal ivaPercent) {
        if (!Boolean.TRUE.equals(applyIva)) return;
        if (ivaPercent == null) {
            throw new BusinessException("Indica el porcentaje de I.V.A.");
        }
        if (ivaPercent.compareTo(BigDecimal.ZERO) < 0 || ivaPercent.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new BusinessException("El I.V.A. debe estar entre 0 y 100");
        }
    }

    /** Acepta lista legacy priceAddons o flag applyIva. */
    public static boolean resolveApplyIva(Boolean applyIva, List<PriceAddonRequest> priceAddons) {
        if (applyIva != null) return applyIva;
        return priceAddons != null && !priceAddons.isEmpty();
    }

    public static BigDecimal resolveIvaPercent(BigDecimal ivaPercent, List<PriceAddonRequest> priceAddons) {
        if (ivaPercent != null) return ivaPercent.setScale(2, RoundingMode.HALF_UP);
        if (priceAddons == null) return DEFAULT_IVA_PERCENT;
        for (PriceAddonRequest req : priceAddons) {
            if (req != null && req.percent() != null) {
                return req.percent().setScale(2, RoundingMode.HALF_UP);
            }
        }
        return DEFAULT_IVA_PERCENT;
    }

    public static List<PriceAddonResponse> toResponses(boolean applyIva, BigDecimal ivaPercent) {
        if (!applyIva) return List.of();
        BigDecimal percent = ivaPercent != null ? ivaPercent : DEFAULT_IVA_PERCENT;
        return List.of(new PriceAddonResponse(IVA_NAME, percent));
    }

    public static String describe(boolean applyIva, BigDecimal ivaPercent) {
        if (!applyIva) return "";
        BigDecimal percent = ivaPercent != null ? ivaPercent : DEFAULT_IVA_PERCENT;
        return IVA_NAME + " " + percent.stripTrailingZeros().toPlainString() + "%";
    }
}
