package com.gymplatform.dto;

public record GymStatsResponse(
        long memberCount,
        long activitiesScheduled,
        long activitiesToday,
        long reservationsToday,
        long confirmedReservations,
        long pendingPayments,
        long salesToday,
        long salesThisMonth,
        long attendancesThisMonth
) {}
