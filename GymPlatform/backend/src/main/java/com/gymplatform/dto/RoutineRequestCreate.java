package com.gymplatform.dto;

import jakarta.validation.constraints.NotBlank;

public record RoutineRequestCreate(
        @NotBlank String description,
        @NotBlank String goals,
        String additionalNotes,
        Long preferredInstructorId
) {}
