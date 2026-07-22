package com.gymplatform.dto;

import java.time.Instant;

public record RoutineRequestResponse(
        Long id,
        Long memberId,
        String memberName,
        String description,
        String goals,
        String additionalNotes,
        String status,
        Long preferredInstructorId,
        String preferredInstructorName,
        Long assignedInstructorId,
        String assignedInstructorName,
        Long resultingRoutineId,
        String resultingRoutineName,
        Instant completedAt
) {}
