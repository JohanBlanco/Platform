package com.gymplatform.dto;

import java.util.List;

/**
 * Resultado de preparar uno o más mensajes para abrir en WhatsApp (wa.me) o Cloud.
 * @param whatsappUrl URL combinada (varios mensajes en un solo chat) cuando aplica wa.me
 * @param messagePreviews Textos individuales en el orden de envío
 * @param deliveryMode WA_ME o CLOUD_API
 */
public record WhatsappMessagesOutboundResponse(
        String whatsappUrl,
        List<String> messagePreviews,
        String deliveryMode,
        String cloudMessageId
) {}
