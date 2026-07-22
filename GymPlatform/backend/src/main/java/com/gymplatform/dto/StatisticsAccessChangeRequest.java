package com.gymplatform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record StatisticsAccessChangeRequest(
        @NotBlank String currentPassword,
        @NotBlank @Size(min = 4, max = 72) String newPassword
) {}
