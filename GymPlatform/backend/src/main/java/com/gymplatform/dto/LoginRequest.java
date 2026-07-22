package com.gymplatform.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank @JsonAlias("email") String login,
        @NotBlank String password
) {}
