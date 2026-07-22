package com.gymplatform.dto;

import com.gymplatform.domain.enums.BroadcastChannel;
import com.gymplatform.domain.enums.WhatsAppDeliveryMode;
import java.time.Instant;

/**
 * Respuesta de configuración WhatsApp.
 * Los secretos nunca viajan en claro: solo flags {@code *Configured} y la clave pública de tránsito.
 */
public record BroadcastChannelSettingsResponse(
        BroadcastChannel channel,
        String senderPhone,
        boolean enabled,
        boolean whatsappWebSessionConfirmed,
        WhatsAppDeliveryMode deliveryMode,
        String cloudApiAppId,
        String cloudApiPhoneNumberId,
        String cloudApiWabaId,
        String cloudApiGraphVersion,
        boolean cloudApiAccessTokenConfigured,
        boolean cloudApiAppSecretConfigured,
        boolean cloudApiVerifyTokenConfigured,
        boolean cloudApiReady,
        String cryptoPublicKeyPem,
        String cryptoKeyId,
        String cryptoAlg,
        Instant updatedAt
) {}
