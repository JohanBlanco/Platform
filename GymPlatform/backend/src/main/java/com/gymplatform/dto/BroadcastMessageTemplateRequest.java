package com.gymplatform.dto;

import com.gymplatform.domain.enums.BroadcastTemplatePurpose;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record BroadcastMessageTemplateRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 4096) String body,
        BroadcastTemplatePurpose purpose,
        Long membershipPackageId,
        /** URLs públicas de imágenes, PDFs u otros recursos a incluir en el mensaje. */
        List<@Size(max = 2048) String> mediaLinks
) {}
