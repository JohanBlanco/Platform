package com.gymplatform.dto;

import com.gymplatform.domain.enums.NutritionPlanStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record NutritionPlanResponse(
        Long id,
        Long memberId,
        String memberName,
        Long createdById,
        String createdByName,
        String title,
        String objective,
        Integer dailyCaloriesTarget,
        Integer proteinGrams,
        Integer carbsGrams,
        Integer fatGrams,
        Double waterLiters,
        List<String> guidelines,
        String notes,
        NutritionPlanStatus status,
        LocalDate validFrom,
        LocalDate validUntil,
        List<NutritionMealResponse> meals,
        Instant createdAt,
        Instant updatedAt
) {}
