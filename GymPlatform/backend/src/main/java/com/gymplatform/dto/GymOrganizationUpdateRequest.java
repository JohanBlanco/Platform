package com.gymplatform.dto;

import jakarta.validation.constraints.NotBlank;

public record GymOrganizationUpdateRequest(
        @NotBlank String currentPassword,
        @NotBlank String name,
        String contactEmail,
        String contactPhone,
        String address,
        String city,
        String tagline,
        String businessHours,
        String websiteUrl,
        String socialHandle,
        String accentId
) {}
