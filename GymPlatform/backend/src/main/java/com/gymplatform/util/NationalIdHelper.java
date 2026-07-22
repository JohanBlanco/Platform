package com.gymplatform.util;

public final class NationalIdHelper {

    private NationalIdHelper() {}

    /** Deja solo dígitos; vacío si no queda nada. */
    public static String normalize(String raw) {
        if (raw == null) {
            return null;
        }
        String digits = raw.replaceAll("\\D", "");
        return digits.isEmpty() ? null : digits;
    }

    public static boolean isValid(String normalized) {
        return normalized != null && normalized.matches("\\d{9}");
    }

    public static String requireValid(String raw) {
        String normalized = normalize(raw);
        if (!isValid(normalized)) {
            throw new IllegalArgumentException("La cédula debe tener 9 dígitos numéricos");
        }
        return normalized;
    }
}
