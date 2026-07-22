package com.gymplatform.dto;

import com.gymplatform.domain.enums.BiologicalSex;
import java.util.List;

public record BodyMeasurementAnalysis(
        Double bmi,
        String bmiCategory,
        Double bodyFatPercent,
        String bodyFatCategory,
        Double waistHipRatio,
        String waistHipRisk,
        Double bmrKcal,
        Double idealWeightMinKg,
        Double idealWeightMaxKg,
        Double fatMassKg,
        Double leanMassKg,
        Double avgArmCm,
        Double avgThighCm,
        Double avgCalfCm,
        List<String> recommendations
) {}
