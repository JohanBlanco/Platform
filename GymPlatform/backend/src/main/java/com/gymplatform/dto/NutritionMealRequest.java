package com.gymplatform.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record NutritionMealRequest(
        @NotBlank String name,
        String suggestedTime,
        String notes,
        @Valid List<NutritionMealItemRequest> items
) {}
