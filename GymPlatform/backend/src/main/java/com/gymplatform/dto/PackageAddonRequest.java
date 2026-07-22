package com.gymplatform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record PackageAddonRequest(
        @NotBlank String name,
        String description,
        @NotNull BigDecimal price
) {}
