package com.gymplatform.util;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public final class ActivityRecurrenceUtil {

    private ActivityRecurrenceUtil() {}

    public static List<String> parseRepeatDays(String repeatDays) {
        if (repeatDays == null || repeatDays.isBlank()) {
            return List.of();
        }
        return Arrays.stream(repeatDays.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(String::toUpperCase)
                .toList();
    }

    public static String serializeRepeatDays(List<String> days) {
        if (days == null || days.isEmpty()) {
            return null;
        }
        return days.stream()
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(String::toUpperCase)
                .distinct()
                .collect(Collectors.joining(","));
    }

    public static void validateRepeatDays(List<String> repeatDays) {
        if (repeatDays == null || repeatDays.isEmpty()) {
            return;
        }
        for (String day : repeatDays) {
            if (day == null || day.isBlank()) {
                throw new IllegalArgumentException("Día de la semana vacío");
            }
            try {
                DayOfWeek.valueOf(day.trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Día de la semana inválido: " + day.trim());
            }
        }
    }

    public static Set<DayOfWeek> toDayOfWeekSet(List<String> repeatDays) {
        Set<DayOfWeek> result = new LinkedHashSet<>();
        for (String day : repeatDays) {
            if (day == null || day.isBlank()) {
                continue;
            }
            try {
                result.add(DayOfWeek.valueOf(day.trim().toUpperCase()));
            } catch (IllegalArgumentException ignored) {
                // Ignorar días corruptos en datos legacy al expandir ocurrencias
            }
        }
        return result;
    }

    public static List<LocalDate> expandOccurrences(
            LocalDate startDate,
            LocalDate endDate,
            boolean recurring,
            String repeatDays,
            LocalDate rangeFrom,
            LocalDate rangeTo) {

        LocalDate effectiveEnd = endDate != null ? endDate : startDate;
        LocalDate from = rangeFrom != null ? rangeFrom : startDate;
        LocalDate to = rangeTo != null ? rangeTo : effectiveEnd;

        LocalDate windowStart = startDate.isAfter(from) ? startDate : from;
        LocalDate windowEnd = effectiveEnd.isBefore(to) ? effectiveEnd : to;
        if (windowStart.isAfter(windowEnd)) {
            return List.of();
        }

        if (!recurring) {
            if (!startDate.isBefore(windowStart) && !startDate.isAfter(windowEnd)) {
                return List.of(startDate);
            }
            return List.of();
        }

        List<String> days = parseRepeatDays(repeatDays);
        if (days.isEmpty()) {
            return List.of();
        }

        Set<DayOfWeek> allowed = toDayOfWeekSet(days);
        List<LocalDate> occurrences = new ArrayList<>();
        for (LocalDate date = windowStart; !date.isAfter(windowEnd); date = date.plusDays(1)) {
            if (allowed.contains(date.getDayOfWeek())) {
                occurrences.add(date);
            }
        }
        return occurrences;
    }
}
