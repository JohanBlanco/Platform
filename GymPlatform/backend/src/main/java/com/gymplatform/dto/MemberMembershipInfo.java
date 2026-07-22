package com.gymplatform.dto;

import com.gymplatform.domain.enums.MemberMembershipStatus;
import java.time.LocalDate;

public record MemberMembershipInfo(
        MemberMembershipStatus status,
        LocalDate nextPaymentDate,
        String membershipPackageName,
        boolean hasQueuedRenewal,
        LocalDate queuedStartDate,
        String queuedPackageName
) {
    public MemberMembershipInfo(MemberMembershipStatus status, LocalDate nextPaymentDate, String membershipPackageName) {
        this(status, nextPaymentDate, membershipPackageName, false, null, null);
    }
}
