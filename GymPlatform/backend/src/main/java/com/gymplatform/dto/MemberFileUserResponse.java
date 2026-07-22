package com.gymplatform.dto;

import java.util.List;

public record MemberFileUserResponse(
        Long userId,
        String firstName,
        String lastName,
        String email,
        int fileCount,
        List<MemberFileSummaryResponse> files
) {}
