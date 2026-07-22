package com.gymplatform.dto;

import java.util.List;

public record FormImportModelFieldResponse(
        String key,
        String label,
        boolean requiredForCreate
) {}
