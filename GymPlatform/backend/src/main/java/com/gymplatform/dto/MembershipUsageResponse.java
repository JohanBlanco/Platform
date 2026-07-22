package com.gymplatform.dto;

public record MembershipUsageResponse(
        Long membershipPackageId,
        String membershipName,
        Integer freeActivityQuota,
        long freeActivitiesUsed,
        Long freeActivitiesRemaining,
        boolean unlimitedFreeActivities
) {}
