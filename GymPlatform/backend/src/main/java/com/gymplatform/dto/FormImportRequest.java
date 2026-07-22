package com.gymplatform.dto;

import com.gymplatform.domain.enums.FormImportMatchField;
import com.gymplatform.domain.enums.FormImportMode;
import com.gymplatform.domain.enums.FormImportTargetModel;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record FormImportRequest(
        @NotNull Long responseFolderId,
        @NotNull FormImportTargetModel targetModel,
        @NotNull FormImportMode mode,
        FormImportMatchField matchField,
        @NotEmpty @Valid List<FormImportFieldMappingDto> mappings
) {}
