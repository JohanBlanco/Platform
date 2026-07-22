package com.gymplatform.dto;

public record NutritionMealItemResponse(
        Long id,
        String foodName,
        String portion,
        String notes,
        int orderIndex
) {}
