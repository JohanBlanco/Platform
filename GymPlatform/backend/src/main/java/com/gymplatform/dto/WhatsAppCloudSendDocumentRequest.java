package com.gymplatform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Envío de documento: por URL pública o subiendo bytes (base64) a {@code /media} y luego enviando por ID.
 */
public record WhatsAppCloudSendDocumentRequest(
        @NotBlank @Size(max = 32) String to,
        @Size(max = 2048) String documentUrl,
        String fileBase64,
        @Size(max = 180) String filename,
        @Size(max = 120) String mimeType,
        @Size(max = 1024) String caption
) {}
