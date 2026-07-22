package com.gymplatform.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record MembershipPackageResponse(
        Long id,
        String name,
        String description,
        BigDecimal price,
        int durationMonths,
        Integer freeActivityQuota,
        boolean active,
        Instant createdAt,
        List<PackageAddonResponse> addons,
        boolean applyIva,
        BigDecimal ivaPercent,
        List<PriceAddonResponse> priceAddons,
        BigDecimal priceWithAddons
) {}
