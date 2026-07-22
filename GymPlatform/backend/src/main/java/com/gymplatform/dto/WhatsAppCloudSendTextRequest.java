package com.gymplatform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Envío de texto vía Cloud API (equivalente a Send Text Message del Postman). */
public record WhatsAppCloudSendTextRequest(
        @NotBlank @Size(max = 32) String to,
        @NotBlank @Size(max = 4096) String body,
        Boolean previewUrl
) {}
