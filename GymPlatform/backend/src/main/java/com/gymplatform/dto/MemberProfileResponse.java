package com.gymplatform.dto;

public record MemberProfileResponse(
        Long id,
        Integer birthYear,
        Integer age,
        String goals,
        String phone,
        String emergencyContact,
        String nationalId
) {}
