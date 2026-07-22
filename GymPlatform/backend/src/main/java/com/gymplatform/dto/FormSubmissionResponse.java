package com.gymplatform.dto;

import java.time.Instant;

public record FormSubmissionResponse(
        Long id,
        Instant createdAt,
        boolean userCreated,
        Long createdUserId,
        String message
) {
    public FormSubmissionResponse(Long id, Instant createdAt) {
        this(id, createdAt, false, null, null);
    }
}
