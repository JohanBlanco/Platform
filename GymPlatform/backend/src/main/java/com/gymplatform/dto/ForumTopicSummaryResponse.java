package com.gymplatform.dto;

import com.gymplatform.domain.enums.MuscleGroup;

public record ForumTopicSummaryResponse(
        Long id,
        Long exerciseId,
        String title,
        String imageUrl,
        String videoUrl,
        String sourceUrl,
        MuscleGroup muscleGroup
) {}
