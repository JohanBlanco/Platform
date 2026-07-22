package com.gymplatform.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record GenerateRoutineRequest(
        @NotNull Long memberId,
        @Min(2) @Max(6) int daysPerWeek,
        /** HYPERTROPHY | STRENGTH | FAT_LOSS | GENERAL | TONE */
        @NotBlank String focus,
        /** 45 | 60 | 75 — opcional */
        Integer sessionMinutes,
        /** FULL_GYM | MACHINES_DUMBBELLS | BODYWEIGHT */
        String equipment,
        /** Sobrescribe lesiones del expediente si se envía */
        String injuriesNotes,
        String goalsOverride,
        /** Principiante | Intermedio | Avanzado — solo si el sistema no lo conoce */
        String levelOverride,
        Long routineRequestId
) {}
