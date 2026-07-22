package com.gymplatform.dto;

import com.gymplatform.domain.enums.BiologicalSex;
import java.time.Instant;

public record BodyMeasurementResponse(
        Long id,
        Long memberId,
        String memberName,
        Long recordedById,
        String recordedByName,
        Instant measuredAt,
        Integer ageYears,
        BiologicalSex sex,
        Double weightKg,
        Double heightCm,
        Double neckCm,
        Double chestCm,
        Double waistCm,
        Double hipsCm,
        Double shouldersCm,
        Double leftArmCm,
        Double rightArmCm,
        Double leftForearmCm,
        Double rightForearmCm,
        Double leftThighCm,
        Double rightThighCm,
        Double leftCalfCm,
        Double rightCalfCm,
        String notes,
        Long appointmentRequestId,
        Instant createdAt,
        BodyMeasurementAnalysis analysis,
        BodyMeasurementComparison comparison
) {}
