package com.gymplatform.domain.entity;

import com.gymplatform.domain.enums.BroadcastChannel;
import com.gymplatform.domain.enums.WhatsAppDeliveryMode;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
        name = "broadcast_channel_settings",
        uniqueConstraints = @UniqueConstraint(columnNames = {"organization_id", "channel"})
)
public class BroadcastChannelSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BroadcastChannel channel;

    /** Número remitente en formato internacional, p. ej. +5215512345678 */
    @Column(length = 32)
    private String senderPhone;

    @Column(nullable = false)
    private boolean enabled = false;

    /** El admin confirmó tener sesión activa en WhatsApp Web en su equipo. */
    @Column(nullable = false)
    private boolean whatsappWebSessionConfirmed = false;

    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private WhatsAppDeliveryMode deliveryMode = WhatsAppDeliveryMode.WA_ME;

    /**
     * Access token de system user (cifrado en reposo). No exponer en respuestas.
     * Meta: longitud variable — tratar como opaco.
     */
    @Column(columnDefinition = "TEXT")
    private String cloudApiAccessToken;

    /** Phone Number ID de Graph API (no es el número E.164 ni el WABA ID). */
    @Column(length = 64)
    private String cloudApiPhoneNumberId;

    /** WhatsApp Business Account ID (opcional; plantillas / Business Management). */
    @Column(length = 64)
    private String cloudApiWabaId;

    @Column(length = 64)
    private String cloudApiAppId;

    /** App Secret cifrado en reposo. */
    @Column(length = 1024)
    private String cloudApiAppSecret;

    /** Verify token del webhook, cifrado en reposo. */
    @Column(length = 1024)
    private String cloudApiVerifyToken;

    /** Versión de Graph API, p. ej. v22.0 */
    @Column(length = 16)
    private String cloudApiGraphVersion = "v25.0";

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    private Instant updatedAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Organization getOrganization() { return organization; }
    public void setOrganization(Organization organization) { this.organization = organization; }
    public BroadcastChannel getChannel() { return channel; }
    public void setChannel(BroadcastChannel channel) { this.channel = channel; }
    public String getSenderPhone() { return senderPhone; }
    public void setSenderPhone(String senderPhone) { this.senderPhone = senderPhone; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public boolean isWhatsappWebSessionConfirmed() { return whatsappWebSessionConfirmed; }
    public void setWhatsappWebSessionConfirmed(boolean whatsappWebSessionConfirmed) {
        this.whatsappWebSessionConfirmed = whatsappWebSessionConfirmed;
    }
    public WhatsAppDeliveryMode getDeliveryMode() {
        return deliveryMode != null ? deliveryMode : WhatsAppDeliveryMode.WA_ME;
    }
    public void setDeliveryMode(WhatsAppDeliveryMode deliveryMode) {
        this.deliveryMode = deliveryMode != null ? deliveryMode : WhatsAppDeliveryMode.WA_ME;
    }
    public String getCloudApiAccessToken() { return cloudApiAccessToken; }
    public void setCloudApiAccessToken(String cloudApiAccessToken) {
        this.cloudApiAccessToken = cloudApiAccessToken;
    }
    public String getCloudApiPhoneNumberId() { return cloudApiPhoneNumberId; }
    public void setCloudApiPhoneNumberId(String cloudApiPhoneNumberId) {
        this.cloudApiPhoneNumberId = cloudApiPhoneNumberId;
    }
    public String getCloudApiWabaId() { return cloudApiWabaId; }
    public void setCloudApiWabaId(String cloudApiWabaId) { this.cloudApiWabaId = cloudApiWabaId; }
    public String getCloudApiAppId() { return cloudApiAppId; }
    public void setCloudApiAppId(String cloudApiAppId) { this.cloudApiAppId = cloudApiAppId; }
    public String getCloudApiAppSecret() { return cloudApiAppSecret; }
    public void setCloudApiAppSecret(String cloudApiAppSecret) {
        this.cloudApiAppSecret = cloudApiAppSecret;
    }
    public String getCloudApiVerifyToken() { return cloudApiVerifyToken; }
    public void setCloudApiVerifyToken(String cloudApiVerifyToken) {
        this.cloudApiVerifyToken = cloudApiVerifyToken;
    }
    public String getCloudApiGraphVersion() {
        return cloudApiGraphVersion != null && !cloudApiGraphVersion.isBlank()
                ? cloudApiGraphVersion
                : "v25.0";
    }
    public void setCloudApiGraphVersion(String cloudApiGraphVersion) {
        this.cloudApiGraphVersion = cloudApiGraphVersion;
    }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public boolean hasCloudApiCredentials() {
        return cloudApiAccessToken != null && !cloudApiAccessToken.isBlank()
                && cloudApiPhoneNumberId != null && !cloudApiPhoneNumberId.isBlank();
    }
}
