package com.gymplatform.dto;

import java.time.Instant;
import java.util.Map;

public record FormSubmissionDetailResponse(
        Long id,
        Long formId,
        String formTitle,
        Long responseFolderId,
        String responseFolderName,
        String submitterName,
        Map<String, Object> answers,
        Instant createdAt,
        Instant importedAt
) {}
