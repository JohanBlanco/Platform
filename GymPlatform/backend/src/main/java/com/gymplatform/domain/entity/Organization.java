package com.gymplatform.domain.entity;

import com.gymplatform.domain.enums.SubscriptionStatus;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "organizations")
public class Organization {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String slug;

    private String contactEmail;
    private String contactPhone;

    private String address;
    private String city;
    private String tagline;
    private String businessHours;
    private String websiteUrl;
    private String socialHandle;

    /** Preset de acento de marca: indigo, emerald, rose, amber, sky */
    @Column(length = 16)
    private String accentId = "indigo";

    /** Decoración estacional de la web: NONE, CHRISTMAS, HALLOWEEN, etc. */
    @Column(length = 32)
    private String seasonTheme = "NONE";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubscriptionStatus subscriptionStatus = SubscriptionStatus.INACTIVE;

    private Instant subscriptionStart;
    private Instant subscriptionEnd;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }
    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getTagline() { return tagline; }
    public void setTagline(String tagline) { this.tagline = tagline; }
    public String getBusinessHours() { return businessHours; }
    public void setBusinessHours(String businessHours) { this.businessHours = businessHours; }
    public String getWebsiteUrl() { return websiteUrl; }
    public void setWebsiteUrl(String websiteUrl) { this.websiteUrl = websiteUrl; }
    public String getSocialHandle() { return socialHandle; }
    public void setSocialHandle(String socialHandle) { this.socialHandle = socialHandle; }
    public String getAccentId() { return accentId; }
    public void setAccentId(String accentId) { this.accentId = accentId; }
    public String getSeasonTheme() { return seasonTheme; }
    public void setSeasonTheme(String seasonTheme) { this.seasonTheme = seasonTheme; }
    public SubscriptionStatus getSubscriptionStatus() { return subscriptionStatus; }
    public void setSubscriptionStatus(SubscriptionStatus subscriptionStatus) { this.subscriptionStatus = subscriptionStatus; }
    public Instant getSubscriptionStart() { return subscriptionStart; }
    public void setSubscriptionStart(Instant subscriptionStart) { this.subscriptionStart = subscriptionStart; }
    public Instant getSubscriptionEnd() { return subscriptionEnd; }
    public void setSubscriptionEnd(Instant subscriptionEnd) { this.subscriptionEnd = subscriptionEnd; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
