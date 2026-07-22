package com.gymplatform.dto;

import java.util.List;

public record FormImportPreviewResponse(
        int totalSubmissions,
        int readyCount,
        int skippedCount,
        int errorCount,
        List<FormImportPreviewRow> rows
) {}
