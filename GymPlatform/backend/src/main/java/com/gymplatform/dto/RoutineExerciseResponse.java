package com.gymplatform.dto;

public record RoutineExerciseResponse(
        Long id,
        Long exerciseId,
        String exerciseName,
        String imageUrl,
        Integer sets,
        Integer reps,
        String weight,
        Integer durationSeconds,
        String notes,
        int orderIndex
) {}
