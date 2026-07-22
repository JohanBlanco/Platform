package com.gymplatform.dto;

import com.gymplatform.domain.enums.FormImportMatchField;
import com.gymplatform.domain.enums.FormImportTargetModel;
import java.util.List;

public record FormImportModelResponse(
        FormImportTargetModel model,
        String label,
        String description,
        List<FormImportModelFieldResponse> fields,
        List<FormImportMatchField> matchFields
) {}
