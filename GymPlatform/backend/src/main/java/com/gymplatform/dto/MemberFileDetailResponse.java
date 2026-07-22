package com.gymplatform.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record MemberFileDetailResponse(
        Long id,
        Long userId,
        String userFullName,
        String userEmail,
        Long formId,
        String formTitle,
        String formDescription,
        String organizationName,
        List<FormFieldDto> fields,
        Map<String, Object> answers,
        Instant createdAt
) {}
