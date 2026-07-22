package com.gymplatform.dto;

import java.util.List;

public record NutritionMealResponse(
        Long id,
        String name,
        String suggestedTime,
        String notes,
        int orderIndex,
        List<NutritionMealItemResponse> items
) {}
