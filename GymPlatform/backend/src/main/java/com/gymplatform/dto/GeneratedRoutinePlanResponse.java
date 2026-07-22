package com.gymplatform.dto;

import java.util.List;

public record GeneratedRoutinePlanResponse(
        String name,
        String description,
        String notes,
        Integer daysPerWeek,
        String focus,
        String instructorSummary,
        List<RoutineDayResponse> days
) {}
