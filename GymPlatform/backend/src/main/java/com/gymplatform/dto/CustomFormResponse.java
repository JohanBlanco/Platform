package com.gymplatform.dto;

import com.gymplatform.domain.enums.FormAccessType;
import com.gymplatform.domain.enums.FormPurpose;
import java.time.Instant;
import java.util.List;

public record CustomFormResponse(
        Long id,
        String title,
        String slug,
        String description,
        FormAccessType accessType,
        FormPurpose formPurpose,
        boolean systemDefault,
        boolean active,
        List<FormFieldDto> fields,
        String publicUrl,
        Long templateFolderId,
        String templateFolderName,
        Long responseFolderId,
        String responseFolderName,
        long submissionCount,
        Instant createdAt,
        Instant updatedAt
) {}
