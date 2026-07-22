package com.gymplatform.dto;

import java.util.List;

public record RoutineGenerationContextResponse(
        Long memberId,
        String memberName,
        Integer age,
        String sex,
        String level,
        String goals,
        String injuries,
        boolean levelKnown,
        boolean injuriesKnown,
        boolean goalsKnown,
        boolean sexKnown,
        List<String> knownSources
) {}
