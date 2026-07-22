package com.gymplatform.util;

import com.gymplatform.dto.FormFieldDto;

import java.util.ArrayList;
import java.util.List;

/**
 * Formulario combinado: crea la cuenta y captura el registro/historial en un solo envío.
 */
public final class MemberOnboardingFormFactory {

    public static final String SLUG = "alta-y-registro";
    public static final String TITLE = "Alta y registro del miembro";
    public static final String DESCRIPTION =
            "Crea tu cuenta y completa tu hoja de ingreso al gimnasio en un solo paso. "
                    + "Al enviar se crea tu usuario y se guarda tu expediente.";

    private MemberOnboardingFormFactory() {}

    public static List<FormFieldDto> defaultFields() {
        List<FormFieldDto> fields = new ArrayList<>(MemberSignupFormFactory.accountFields());
        // Evita duplicar "nombre completo" del registro: el expediente usará nombre+apellido de la cuenta.
        for (FormFieldDto field : MemberRegistrationFormFactory.defaultFields()) {
            if ("f-nombre".equals(field.id())) {
                continue;
            }
            fields.add(field);
        }
        return fields;
    }
}
