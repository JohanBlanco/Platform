package com.gymplatform.dto;

import java.util.List;

public record AuthResponse(
        String token,
        Long userId,
        String email,
        String firstName,
        String lastName,
        List<String> roles,
        Long organizationId
) {}
