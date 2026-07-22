package com.gymplatform.dto;

import java.util.List;

public record UserCreateResponse(
        UserResponse user,
        String registrationFormWhatsappUrl,
        String registrationFormDeliveryMode,
        String registrationFormCloudMessageId,
        List<String> whatsappMessagePreviews
) {
    public UserCreateResponse(UserResponse user, String registrationFormWhatsappUrl) {
        this(user, registrationFormWhatsappUrl, registrationFormWhatsappUrl != null ? "WA_ME" : null, null, List.of());
    }

    public static UserCreateResponse of(UserResponse user, WhatsappMessagesOutboundResponse outbound) {
        if (outbound == null) {
            return new UserCreateResponse(user, null, null, null, List.of());
        }
        return new UserCreateResponse(
                user,
                outbound.whatsappUrl(),
                outbound.deliveryMode(),
                outbound.cloudMessageId(),
                outbound.messagePreviews() != null ? outbound.messagePreviews() : List.of());
    }

    public static UserCreateResponse of(UserResponse user, WhatsappOutboundResponse outbound) {
        if (outbound == null) {
            return new UserCreateResponse(user, null, null, null, List.of());
        }
        return new UserCreateResponse(
                user,
                outbound.whatsappUrl(),
                outbound.deliveryMode(),
                outbound.cloudMessageId(),
                outbound.messagePreview() != null ? List.of(outbound.messagePreview()) : List.of());
    }
}
