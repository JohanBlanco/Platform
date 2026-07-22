package com.gymplatform.dto;

/**
 * @param whatsappUrl URL wa.me si aplica; null cuando se envió por Cloud API.
 * @param messagePreview Texto del mensaje.
 * @param deliveryMode {@code WA_ME} o {@code CLOUD_API}.
 * @param cloudMessageId ID de mensaje Graph si Cloud API.
 */
public record WhatsappOutboundResponse(
        String whatsappUrl,
        String messagePreview,
        String deliveryMode,
        String cloudMessageId
) {
    public WhatsappOutboundResponse(String whatsappUrl, String messagePreview) {
        this(whatsappUrl, messagePreview, "WA_ME", null);
    }
}
