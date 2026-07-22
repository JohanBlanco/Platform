package com.gymplatform.dto;

import com.gymplatform.domain.enums.SubscriptionStatus;
import java.time.Instant;

public record OrganizationResponse(
        Long id,
        String name,
        String slug,
        String contactEmail,
        String contactPhone,
        SubscriptionStatus subscriptionStatus,
        boolean active,
        Instant createdAt,
        String ownerFirstName,
        String ownerLastName,
        String ownerEmail
) {}
