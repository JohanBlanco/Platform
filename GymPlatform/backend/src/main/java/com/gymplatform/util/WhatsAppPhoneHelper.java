package com.gymplatform.util;

import com.gymplatform.exception.BusinessException;

public final class WhatsAppPhoneHelper {

    public static final String COSTA_RICA_CODE = "+506";

    private WhatsAppPhoneHelper() {}

    public static String normalizeCostaRicaLocal(String localPhone) {
        if (localPhone == null || localPhone.isBlank()) {
            throw new BusinessException("El número de WhatsApp es obligatorio");
        }
        String digits = localPhone.replaceAll("\\D", "");
        if (digits.startsWith("506") && digits.length() == 11) {
            digits = digits.substring(3);
        }
        if (digits.length() != 8) {
            throw new BusinessException("El número de WhatsApp debe tener 8 dígitos");
        }
        return COSTA_RICA_CODE + digits;
    }

    public static String toLocalDisplay(String fullPhone) {
        if (fullPhone == null || fullPhone.isBlank()) {
            return "";
        }
        String digits = fullPhone.replaceAll("\\D", "");
        if (digits.startsWith("506") && digits.length() >= 11) {
            return digits.substring(3, 11);
        }
        if (digits.length() == 8) {
            return digits;
        }
        return digits;
    }

    /** Solo dígitos (E.164 sin +), para Cloud API {@code to}. */
    public static String toDigitsOnly(String phone) {
        if (phone == null || phone.isBlank()) {
            return null;
        }
        String digits = phone.replaceAll("\\D", "");
        return digits.isEmpty() ? null : digits;
    }
}
