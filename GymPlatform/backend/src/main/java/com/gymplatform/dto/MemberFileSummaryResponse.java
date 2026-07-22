package com.gymplatform.dto;

import java.time.Instant;

public record MemberFileSummaryResponse(
        Long id,
        Long formId,
        String formTitle,
        String formSlug,
        Instant createdAt
) {}
