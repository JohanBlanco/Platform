package com.gymplatform.dto;

import jakarta.validation.constraints.NotBlank;

public record NutritionMealItemRequest(
        @NotBlank String foodName,
        String portion,
        String notes
) {}
