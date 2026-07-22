package com.gymplatform.dto;

import com.gymplatform.domain.enums.BiologicalSex;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.Instant;

public record BodyMeasurementCreateRequest(
        @NotNull Long memberId,
        Instant measuredAt,
        @NotNull @Min(10) @Max(120) Integer ageYears,
        @NotNull BiologicalSex sex,
        @NotNull @Positive Double weightKg,
        @NotNull @Positive Double heightCm,
        @Positive Double neckCm,
        @Positive Double chestCm,
        @Positive Double waistCm,
        @Positive Double hipsCm,
        @Positive Double shouldersCm,
        @Positive Double leftArmCm,
        @Positive Double rightArmCm,
        @Positive Double leftForearmCm,
        @Positive Double rightForearmCm,
        @Positive Double leftThighCm,
        @Positive Double rightThighCm,
        @Positive Double leftCalfCm,
        @Positive Double rightCalfCm,
        String notes,
        Long appointmentRequestId
) {}
