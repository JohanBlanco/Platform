package com.gymplatform.e2e.support;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.ThreadLocalRandom;

public final class TestData {

    private TestData() {}

    public static String suffix() {
        return Long.toString(System.currentTimeMillis() % 1_000_000L);
    }

    public static String uniqueEmail(String prefix) {
        return prefix + "+" + suffix() + "@e2e.gymplatform.test";
    }

    public static String uniqueNationalId() {
        int base = ThreadLocalRandom.current().nextInt(100_000_000, 999_999_999);
        return Integer.toString(base);
    }

    public static String todayIso() {
        return LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
    }

    public static String tomorrowIso() {
        return LocalDate.now().plusDays(1).format(DateTimeFormatter.ISO_LOCAL_DATE);
    }

    public static String plusDaysIso(int days) {
        return LocalDate.now().plusDays(days).format(DateTimeFormatter.ISO_LOCAL_DATE);
    }
}
