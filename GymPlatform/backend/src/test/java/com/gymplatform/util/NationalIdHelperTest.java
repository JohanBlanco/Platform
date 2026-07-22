package com.gymplatform.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NationalIdHelperTest {

    @Test
    void normalizesDigitsOnly() {
        assertEquals("190205678", NationalIdHelper.normalize("1-902-05678"));
        assertEquals("190205678", NationalIdHelper.normalize("190205678"));
    }

    @Test
    void validatesNineDigits() {
        assertTrue(NationalIdHelper.isValid("190205678"));
        assertFalse(NationalIdHelper.isValid("12345"));
        assertFalse(NationalIdHelper.isValid(null));
    }

    @Test
    void requireValidThrowsOnInvalid() {
        assertThrows(IllegalArgumentException.class, () -> NationalIdHelper.requireValid("123"));
    }
}
