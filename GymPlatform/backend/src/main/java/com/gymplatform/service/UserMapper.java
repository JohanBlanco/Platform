package com.gymplatform.service;

import com.gymplatform.domain.entity.MemberProfile;
import com.gymplatform.domain.entity.User;
import com.gymplatform.domain.enums.MemberMembershipStatus;
import com.gymplatform.domain.enums.Role;
import com.gymplatform.dto.MemberMembershipInfo;
import com.gymplatform.dto.MemberProfileResponse;
import com.gymplatform.dto.UserResponse;
import com.gymplatform.util.RoleUtils;

public final class UserMapper {

    private UserMapper() {}

    public static UserResponse toResponse(User user, MemberProfile profile) {
        return toResponse(user, profile, null);
    }

    public static UserResponse toResponse(User user, MemberProfile profile, MemberMembershipInfo membershipInfo) {
        MemberProfileResponse profileResponse = null;
        if (profile != null) {
            String nationalId = user.getNationalId() != null ? user.getNationalId() : profile.getNationalId();
            profileResponse = new MemberProfileResponse(
                    profile.getId(), profile.getBirthYear(), profile.getAge(),
                    profile.getGoals(), profile.getPhone(), profile.getEmergencyContact(),
                    nationalId
            );
        }
        MemberMembershipStatus status = null;
        java.time.LocalDate nextPaymentDate = null;
        String membershipPackageName = null;
        boolean hasQueuedRenewal = false;
        java.time.LocalDate queuedStartDate = null;
        String queuedPackageName = null;
        if (membershipInfo != null && user.hasRole(Role.MEMBER)) {
            status = membershipInfo.status();
            nextPaymentDate = membershipInfo.nextPaymentDate();
            membershipPackageName = membershipInfo.membershipPackageName();
            hasQueuedRenewal = membershipInfo.hasQueuedRenewal();
            queuedStartDate = membershipInfo.queuedStartDate();
            queuedPackageName = membershipInfo.queuedPackageName();
        }
        return new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                RoleUtils.toNames(user.getRoles()),
                user.getOrganization() != null ? user.getOrganization().getId() : null,
                user.isActive(),
                user.getCreatedAt(),
                profileResponse,
                status,
                nextPaymentDate,
                membershipPackageName,
                hasQueuedRenewal,
                queuedStartDate,
                queuedPackageName,
                user.getWhatsappPhone(),
                user.getNationalId()
        );
    }
}
