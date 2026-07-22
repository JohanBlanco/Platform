package com.gymplatform.dto;

import jakarta.validation.constraints.NotBlank;

public record FormImportFieldMappingDto(
        @NotBlank String formFieldId,
        @NotBlank String targetField
) {}
