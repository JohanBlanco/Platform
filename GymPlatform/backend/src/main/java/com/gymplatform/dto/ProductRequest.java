package com.gymplatform.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.util.List;

public record ProductRequest(
        @NotBlank String name,
        List<Long> categoryIds,
        List<String> newCategories,
        String description,
        String imageUrl,
        @Min(0) Integer stockUnits,
        @Min(1) Integer unitsPerPackage,
        String packageLabel,
        String unitLabel,
        @DecimalMin("0.0") BigDecimal packagePrice,
        @DecimalMin("0.0") BigDecimal unitPrice,
        Boolean sellByPackage,
        Boolean sellByUnit,
        Boolean applyIva,
        @DecimalMin("0.0") BigDecimal ivaPercent,
        /** Compatibilidad: si applyIva es null, se deriva de esta lista. */
        @Valid List<PriceAddonRequest> priceAddons
) {}
