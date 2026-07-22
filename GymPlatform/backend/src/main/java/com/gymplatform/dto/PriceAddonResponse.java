package com.gymplatform.dto;

import java.math.BigDecimal;

public record PriceAddonResponse(
        String name,
        BigDecimal percent
) {}
