package com.gymplatform.dto;

public record AvailableSlotResponse(
        String startTime,
        String endTime,
        boolean available,
        Long appointmentId
) {}
