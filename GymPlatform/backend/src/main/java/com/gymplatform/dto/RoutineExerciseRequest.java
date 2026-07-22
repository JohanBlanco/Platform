package com.gymplatform.dto;

import jakarta.validation.constraints.NotBlank;

public record RoutineExerciseRequest(
        Long exerciseId,
        @NotBlank String exerciseName,
        String imageUrl,
        Integer sets,
        Integer reps,
        String weight,
        Integer durationSeconds,
        String notes,
        int orderIndex
) {}
