package com.gymplatform.util;

import com.gymplatform.domain.entity.BodyMeasurement;
import com.gymplatform.domain.enums.BiologicalSex;
import com.gymplatform.dto.BodyMeasurementAnalysis;
import com.gymplatform.dto.BodyMeasurementComparison;
import java.util.ArrayList;
import java.util.List;

public final class BodyMetricsCalculator {

    private BodyMetricsCalculator() {}

    public static BodyMeasurementAnalysis analyze(BodyMeasurement m) {
        return analyze(m, null);
    }

    public static BodyMeasurementAnalysis analyze(BodyMeasurement m, BodyMeasurement previous) {
        double heightM = m.getHeightCm() / 100.0;
        double bmi = m.getWeightKg() / (heightM * heightM);
        String bmiCategory = bmiCategory(bmi);

        Double bodyFat = estimateBodyFatPercent(m);
        String bodyFatCategory = bodyFat != null ? bodyFatCategory(m.getSex(), bodyFat) : null;

        Double whr = waistHipRatio(m);
        String whrRisk = whr != null ? waistHipRisk(m.getSex(), whr) : null;

        Double bmr = bmr(m);
        double idealMin = 18.5 * heightM * heightM;
        double idealMax = 24.9 * heightM * heightM;

        Double fatMass = bodyFat != null ? m.getWeightKg() * bodyFat / 100.0 : null;
        Double leanMass = fatMass != null ? m.getWeightKg() - fatMass : null;

        List<String> recommendations = buildRecommendations(m, bmi, bmiCategory, bodyFat, bodyFatCategory,
                whr, whrRisk, previous);

        return new BodyMeasurementAnalysis(
                round1(bmi),
                bmiCategory,
                bodyFat != null ? round1(bodyFat) : null,
                bodyFatCategory,
                whr != null ? round2(whr) : null,
                whrRisk,
                bmr != null ? round0(bmr) : null,
                round1(idealMin),
                round1(idealMax),
                fatMass != null ? round1(fatMass) : null,
                leanMass != null ? round1(leanMass) : null,
                avg(m.getLeftArmCm(), m.getRightArmCm()),
                avg(m.getLeftThighCm(), m.getRightThighCm()),
                avg(m.getLeftCalfCm(), m.getRightCalfCm()),
                recommendations
        );
    }

    public static BodyMeasurementComparison compare(BodyMeasurement current, BodyMeasurement previous) {
        if (previous == null) return null;

        BodyMeasurementAnalysis currentAnalysis = analyze(current);
        BodyMeasurementAnalysis previousAnalysis = analyze(previous);

        return new BodyMeasurementComparison(
                previous.getId(),
                previous.getMeasuredAt(),
                round1(current.getWeightKg() - previous.getWeightKg()),
                diff(current.getWaistCm(), previous.getWaistCm()),
                diff(currentAnalysis.bodyFatPercent(), previousAnalysis.bodyFatPercent()),
                currentAnalysis.bmi() != null && previousAnalysis.bmi() != null
                        ? round1(currentAnalysis.bmi() - previousAnalysis.bmi()) : null
        );
    }

    private static List<String> buildRecommendations(BodyMeasurement m, double bmi, String bmiCategory,
                                                     Double bodyFat, String bodyFatCategory,
                                                     Double whr, String whrRisk,
                                                     BodyMeasurement previous) {
        List<String> tips = new ArrayList<>();

        switch (bmiCategory) {
            case "Bajo peso" -> {
                tips.add("Tu IMC indica bajo peso. Prioriza una alimentación calórica equilibrada con proteína suficiente.");
                tips.add("Combina entrenamiento de fuerza progresivo con descanso adecuado para ganar masa muscular de forma saludable.");
            }
            case "Peso normal" -> tips.add("Tu IMC está en rango saludable. Mantén hábitos consistentes de alimentación y actividad física.");
            case "Sobrepeso" -> {
                tips.add("Tu IMC sugiere sobrepeso. Un déficit calórico moderado (300–500 kcal) suele ser sostenible.");
                tips.add("Incluye entrenamiento de fuerza 3–4 veces por semana para preservar masa muscular mientras reduces grasa.");
            }
            case "Obesidad" -> {
                tips.add("Tu IMC indica obesidad. Consulta con un profesional de salud para un plan personalizado.");
                tips.add("Empieza con caminatas diarias y fuerza de bajo impacto; la constancia importa más que la intensidad inicial.");
            }
            default -> {}
        }

        if (bodyFatCategory != null) {
            switch (bodyFatCategory) {
                case "Esencial" -> tips.add("Tu porcentaje de grasa está muy bajo. Asegura ingesta calórica y grasas saludables suficientes.");
                case "Atlético" -> tips.add("Excelente composición corporal. Mantén proteína alta y periodiza el entrenamiento para evitar sobreentrenamiento.");
                case "Fitness" -> tips.add("Buen nivel de grasa corporal. Puedes enfocarte en rendimiento o definición según tu objetivo.");
                case "Promedio" -> tips.add("Hay margen de mejora en composición corporal. Prioriza proteína, sueño y entrenamiento de fuerza.");
                case "Elevado" -> tips.add("Tu grasa corporal está elevada. Combina fuerza, cardio moderado y control de porciones.");
                default -> {}
            }
        } else if (m.getWaistCm() == null || m.getNeckCm() == null) {
            tips.add("Para estimar grasa corporal con mayor precisión, registra circunferencia de cuello"
                    + (m.getSex() == BiologicalSex.FEMALE ? ", cintura y cadera." : " y cintura."));
        }

        if (whrRisk != null) {
            if ("Riesgo alto".equals(whrRisk)) {
                tips.add("La relación cintura-cadera indica acumulación central de grasa. Reduce azúcares refinados y aumenta actividad diaria.");
            } else if ("Riesgo moderado".equals(whrRisk)) {
                tips.add("Monitorea tu cintura: el entrenamiento de core y el cardio moderado ayudan a reducir grasa abdominal.");
            }
        }

        double waistLimit = m.getSex() == BiologicalSex.MALE ? 102.0 : 88.0;
        if (m.getWaistCm() != null && m.getWaistCm() > waistLimit) {
            tips.add("Tu cintura supera el umbral recomendado por la OMS (" + (int) waistLimit + " cm). "
                    + "Enfócate en hábitos cardiovasculares y alimentación antiinflamatoria.");
        }

        if (m.getWeightKg() > 24.9 * Math.pow(m.getHeightCm() / 100.0, 2)) {
            tips.add("Peso ideal estimado: entre " + round1(18.5 * Math.pow(m.getHeightCm() / 100.0, 2))
                    + " y " + round1(24.9 * Math.pow(m.getHeightCm() / 100.0, 2)) + " kg según IMC saludable.");
        }

        if (previous != null) {
            double weightDelta = m.getWeightKg() - previous.getWeightKg();
            if (Math.abs(weightDelta) >= 0.3) {
                if (weightDelta < 0) {
                    tips.add("Respecto a la medición anterior, bajaste " + round1(Math.abs(weightDelta))
                            + " kg. Verifica que la pérdida sea gradual (0.3–0.8 kg/semana).");
                } else {
                    tips.add("Respecto a la medición anterior, subiste " + round1(weightDelta)
                            + " kg. Si buscas ganar músculo, asegura superávit controlado y progresión en fuerza.");
                }
            }
            if (m.getWaistCm() != null && previous.getWaistCm() != null) {
                double waistDelta = m.getWaistCm() - previous.getWaistCm();
                if (waistDelta <= -1) {
                    tips.add("¡Buen progreso! Tu cintura disminuyó " + round1(Math.abs(waistDelta)) + " cm desde la última medición.");
                } else if (waistDelta >= 1) {
                    tips.add("Tu cintura aumentó " + round1(waistDelta) + " cm. Revisa alimentación, estrés y horas de sueño.");
                }
            }
        }

        if (tips.isEmpty()) {
            tips.add("Continúa registrando mediciones periódicas para seguir tu evolución con tu instructor.");
        }

        return tips.stream().distinct().toList();
    }

    /** Método de la Marina de EE.UU. (US Navy) para estimar grasa corporal. */
    public static Double estimateBodyFatPercent(BodyMeasurement m) {
        if (m.getHeightCm() == null || m.getNeckCm() == null || m.getWaistCm() == null) {
            return null;
        }
        try {
            if (m.getSex() == BiologicalSex.MALE) {
                double diff = m.getWaistCm() - m.getNeckCm();
                if (diff <= 0) return null;
                double bf = 495.0 / (1.0324 - 0.19077 * Math.log10(diff) + 0.15456 * Math.log10(m.getHeightCm())) - 450.0;
                return clamp(bf, 3, 60);
            }
            if (m.getHipsCm() == null) return null;
            double sum = m.getWaistCm() + m.getHipsCm() - m.getNeckCm();
            if (sum <= 0) return null;
            double bf = 495.0 / (1.29579 - 0.35004 * Math.log10(sum) + 0.22100 * Math.log10(m.getHeightCm())) - 450.0;
            return clamp(bf, 8, 65);
        } catch (Exception e) {
            return null;
        }
    }

    public static Double bmr(BodyMeasurement m) {
        if (m.getAgeYears() == null) return null;
        if (m.getSex() == BiologicalSex.MALE) {
            return 10 * m.getWeightKg() + 6.25 * m.getHeightCm() - 5 * m.getAgeYears() + 5;
        }
        return 10 * m.getWeightKg() + 6.25 * m.getHeightCm() - 5 * m.getAgeYears() - 161;
    }

    public static Double waistHipRatio(BodyMeasurement m) {
        if (m.getWaistCm() == null || m.getHipsCm() == null || m.getHipsCm() <= 0) return null;
        return m.getWaistCm() / m.getHipsCm();
    }

    public static String bmiCategory(double bmi) {
        if (bmi < 18.5) return "Bajo peso";
        if (bmi < 25) return "Peso normal";
        if (bmi < 30) return "Sobrepeso";
        return "Obesidad";
    }

    public static String bodyFatCategory(BiologicalSex sex, double bf) {
        if (sex == BiologicalSex.MALE) {
            if (bf < 6) return "Esencial";
            if (bf < 14) return "Atlético";
            if (bf < 18) return "Fitness";
            if (bf < 25) return "Promedio";
            return "Elevado";
        }
        if (bf < 14) return "Esencial";
        if (bf < 21) return "Atlético";
        if (bf < 25) return "Fitness";
        if (bf < 32) return "Promedio";
        return "Elevado";
    }

    public static String waistHipRisk(BiologicalSex sex, double whr) {
        if (sex == BiologicalSex.MALE) {
            if (whr < 0.90) return "Riesgo bajo";
            if (whr < 1.0) return "Riesgo moderado";
            return "Riesgo alto";
        }
        if (whr < 0.80) return "Riesgo bajo";
        if (whr < 0.85) return "Riesgo moderado";
        return "Riesgo alto";
    }

    private static Double avg(Double a, Double b) {
        if (a == null && b == null) return null;
        if (a == null) return round1(b);
        if (b == null) return round1(a);
        return round1((a + b) / 2.0);
    }

    private static Double diff(Double current, Double previous) {
        if (current == null || previous == null) return null;
        return round1(current - previous);
    }

    private static double clamp(double v, double min, double max) {
        return Math.max(min, Math.min(max, v));
    }

    private static double round0(double v) { return Math.round(v); }
    private static double round1(double v) { return Math.round(v * 10.0) / 10.0; }
    private static double round2(double v) { return Math.round(v * 100.0) / 100.0; }
}
