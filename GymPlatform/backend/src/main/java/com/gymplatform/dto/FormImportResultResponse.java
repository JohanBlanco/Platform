package com.gymplatform.dto;

public record FormImportResultResponse(
        int created,
        int updated,
        int skipped,
        int errors
) {}
