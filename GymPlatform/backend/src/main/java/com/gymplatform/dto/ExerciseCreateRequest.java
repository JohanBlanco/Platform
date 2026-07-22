package com.gymplatform.dto;

import com.gymplatform.domain.enums.ExerciseDifficulty;
import com.gymplatform.domain.enums.MuscleGroup;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ExerciseCreateRequest(
        @NotBlank String name,
        @NotNull MuscleGroup muscleGroup,
        ExerciseDifficulty difficulty,
        String description
) {}
