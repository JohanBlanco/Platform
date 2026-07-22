package com.gymplatform.dto;

import com.gymplatform.domain.enums.ExerciseDifficulty;
import com.gymplatform.domain.enums.MuscleGroup;

public record ExerciseResponse(
        Long id,
        String name,
        MuscleGroup muscleGroup,
        ExerciseDifficulty difficulty,
        String imageUrl,
        String videoUrl,
        String guideUrl,
        String description
) {}
