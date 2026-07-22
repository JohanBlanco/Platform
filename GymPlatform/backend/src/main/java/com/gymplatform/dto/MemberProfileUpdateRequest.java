package com.gymplatform.dto;

public record MemberProfileUpdateRequest(
        Integer birthYear,
        Integer age,
        String goals,
        String phone,
        String emergencyContact,
        String nationalId
) {}
