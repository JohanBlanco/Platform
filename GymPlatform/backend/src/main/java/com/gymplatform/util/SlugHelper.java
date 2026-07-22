package com.gymplatform.util;

import com.gymplatform.exception.BusinessException;
import java.text.Normalizer;
import java.util.Locale;

public final class SlugHelper {

    private SlugHelper() {}

    public static String slugify(String input) {
        if (input == null || input.isBlank()) {
            throw new BusinessException("El slug es obligatorio");
        }
        String normalized = Normalizer.normalize(input.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);
        String slug = normalized
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("[\\s_]+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
        if (slug.isBlank()) {
            throw new BusinessException("No se pudo generar un slug válido");
        }
        return slug.length() > 120 ? slug.substring(0, 120) : slug;
    }
}
