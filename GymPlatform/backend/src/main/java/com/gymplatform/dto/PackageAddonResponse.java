package com.gymplatform.dto;

import java.math.BigDecimal;

public record PackageAddonResponse(
        Long id,
        String name,
        String description,
        BigDecimal price,
        boolean active
) {}
