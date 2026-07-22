package com.gymplatform.util;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Enlaces oficiales de WhatsApp (wa.me) para el MVP.
 * Envío real sin abrir la app: pendiente de API de Meta.
 */
public final class WhatsAppLinkHelper {

    private WhatsAppLinkHelper() {}

    public static String buildChatUrl(String recipientPhone, String message) {
        if (recipientPhone == null || recipientPhone.isBlank()) {
            throw new IllegalArgumentException("recipientPhone is required");
        }
        String digits = recipientPhone.replaceAll("\\D", "");
        if (digits.isBlank()) {
            throw new IllegalArgumentException("recipientPhone is required");
        }
        String encoded = URLEncoder.encode(message == null ? "" : message, StandardCharsets.UTF_8)
                .replace("+", "%20");
        return "https://wa.me/" + digits + "?text=" + encoded;
    }
}
