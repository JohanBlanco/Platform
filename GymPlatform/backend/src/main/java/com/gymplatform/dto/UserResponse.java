package com.gymplatform.dto;

import com.gymplatform.domain.enums.MemberMembershipStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record UserResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        List<String> roles,
        Long organizationId,
        boolean active,
        Instant createdAt,
        MemberProfileResponse profile,
        MemberMembershipStatus membershipStatus,
        LocalDate nextPaymentDate,
        String membershipPackageName,
        boolean hasQueuedRenewal,
        LocalDate queuedStartDate,
        String queuedPackageName,
        String whatsappPhone,
        String nationalId
) {}
