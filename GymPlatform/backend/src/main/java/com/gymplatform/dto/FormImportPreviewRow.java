package com.gymplatform.dto;

import com.gymplatform.domain.enums.FormImportMode;
import java.util.Map;

public record FormImportPreviewRow(
        Long submissionId,
        String formTitle,
        FormImportMode action,
        String status,
        String message,
        Long matchedUserId,
        Map<String, String> previewValues
) {}
