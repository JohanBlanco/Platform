package com.gymplatform.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

public record NutritionPlanCreateRequest(
        @NotNull Long memberId,
        @NotBlank String title,
        String objective,
        Integer dailyCaloriesTarget,
        Integer proteinGrams,
        Integer carbsGrams,
        Integer fatGrams,
        Double waterLiters,
        List<String> guidelines,
        String notes,
        LocalDate validFrom,
        LocalDate validUntil,
        @Valid List<NutritionMealRequest> meals
) {}
