package com.gymplatform.dto;

import com.gymplatform.domain.enums.FormAccessType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CustomFormRequest(
        @NotBlank String title,
        @Schema(description = "Opcional. Se genera desde el título si se omite.")
        String slug,
        String description,
        @NotNull FormAccessType accessType,
        boolean active,
        @Valid @NotNull List<FormFieldDto> fields,
        @Schema(description = "Carpeta de organización del formulario (plantillas).")
        Long templateFolderId,
        @Schema(description = "Carpeta donde se guardan las respuestas. Si se omite, se crea una automática.")
        Long responseFolderId
) {}
