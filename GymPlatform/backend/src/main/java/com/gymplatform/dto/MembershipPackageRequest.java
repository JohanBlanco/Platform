package com.gymplatform.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public record MembershipPackageRequest(
        @NotBlank String name,
        String description,
        @NotNull BigDecimal price,
        int durationMonths,
        Integer freeActivityQuota,
        List<PackageAddonRequest> addons,
        Boolean applyIva,
        @DecimalMin("0.0") BigDecimal ivaPercent,
        @Valid List<PriceAddonRequest> priceAddons
) {}
