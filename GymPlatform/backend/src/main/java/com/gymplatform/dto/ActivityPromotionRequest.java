package com.gymplatform.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ActivityPromotionRequest(
        @NotNull Long activityId,
        @Size(max = 1500) String imageUrl
) {}
