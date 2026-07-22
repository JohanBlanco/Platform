package com.gymplatform.dto;

public record GymOrganizationResponse(
        Long id,
        String name,
        String slug,
        String contactEmail,
        String contactPhone,
        String address,
        String city,
        String tagline,
        String businessHours,
        String websiteUrl,
        String socialHandle,
        String accentId,
        String seasonTheme
) {}
