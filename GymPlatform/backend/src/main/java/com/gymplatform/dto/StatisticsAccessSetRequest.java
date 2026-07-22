package com.gymplatform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record StatisticsAccessSetRequest(
        @NotBlank @Size(min = 4, max = 72) String password
) {}
