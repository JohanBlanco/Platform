package com.gymplatform.dto;

import com.gymplatform.crypto.EncryptedSecretPayload;
import com.gymplatform.domain.enums.WhatsAppDeliveryMode;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Actualización de canal WhatsApp.
 * Los secretos van cifrados en {@link #encryptedSecrets} (RSA+AES); no se envían en claro.
 * Omitir un secreto en el sobre = no cambiarlo. Flags {@code clear*} para borrarlo.
 */
public record BroadcastChannelSettingsRequest(
        @Size(max = 32) String senderPhone,
        @NotNull Boolean enabled,
        Boolean whatsappWebSessionConfirmed,
        WhatsAppDeliveryMode deliveryMode,
        @Size(max = 64) String cloudApiAppId,
        @Size(max = 64) String cloudApiPhoneNumberId,
        @Size(max = 64) String cloudApiWabaId,
        @Size(max = 16) String cloudApiGraphVersion,
        EncryptedSecretPayload encryptedSecrets,
        Boolean clearAccessToken,
        Boolean clearAppSecret,
        Boolean clearVerifyToken
) {}
