package com.gymplatform.dto;

import com.gymplatform.domain.enums.StoreSaleItemKind;

import java.math.BigDecimal;

public record StoreSaleItemResponse(
        Long id,
        StoreSaleItemKind kind,
        Long productId,
        Long membershipPackageId,
        String description,
        int quantity,
        int stockUnitsDeducted,
        BigDecimal unitPrice,
        BigDecimal lineTotal
) {}
