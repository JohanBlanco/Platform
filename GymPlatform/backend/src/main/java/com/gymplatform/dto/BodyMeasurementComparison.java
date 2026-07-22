package com.gymplatform.dto;

import java.time.Instant;

public record BodyMeasurementComparison(
        Long previousMeasurementId,
        Instant previousMeasuredAt,
        Double weightChangeKg,
        Double waistChangeCm,
        Double bodyFatChangePercent,
        Double bmiChange
) {}
