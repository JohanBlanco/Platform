package com.gymplatform.dto;

import jakarta.validation.constraints.NotBlank;

public record SeasonThemeUpdateRequest(
        @NotBlank String seasonTheme
) {}
