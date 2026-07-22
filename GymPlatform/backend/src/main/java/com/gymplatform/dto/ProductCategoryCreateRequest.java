package com.gymplatform.dto;

import jakarta.validation.constraints.NotBlank;

public record ProductCategoryCreateRequest(
        @NotBlank String name,
        String description
) {}
