package com.gymplatform.dto;

import java.util.List;

/**
 * Resultado de un envío masivo de mensajes WhatsApp a usuarios con número.
 */
public record WhatsappBulkMessagesOutboundResponse(
        int recipientCount,
        int sentCount,
        int failedCount,
        String deliveryMode,
        List<String> errors
) {}
