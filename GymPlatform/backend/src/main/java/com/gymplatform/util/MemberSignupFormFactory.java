package com.gymplatform.util;

import com.gymplatform.domain.enums.FormFieldType;
import com.gymplatform.dto.FormFieldDto;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Campos de cuenta para alta pública de miembros.
 * Los IDs son fijos: el submit los usa para crear el usuario.
 */
public final class MemberSignupFormFactory {

    public static final String SLUG = "alta-usuario";
    public static final String TITLE = "Alta de usuario";
    public static final String DESCRIPTION =
            "Completa tus datos para crear tu cuenta de miembro en el gimnasio. "
                    + "Al enviar el formulario se crea tu usuario automáticamente.";

    public static final String FIELD_FIRST_NAME = "u-firstName";
    public static final String FIELD_LAST_NAME = "u-lastName";
    public static final String FIELD_EMAIL = "u-email";
    public static final String FIELD_NATIONAL_ID = "u-nationalId";
    public static final String FIELD_WHATSAPP = "u-whatsapp";
    public static final String FIELD_PASSWORD = "u-password";
    public static final String FIELD_MEMBERSHIP = "u-membershipPackageId";

    public static final Set<String> ACCOUNT_FIELD_IDS = Set.of(
            FIELD_FIRST_NAME,
            FIELD_LAST_NAME,
            FIELD_EMAIL,
            FIELD_NATIONAL_ID,
            FIELD_WHATSAPP,
            FIELD_PASSWORD,
            FIELD_MEMBERSHIP
    );

    private MemberSignupFormFactory() {}

    public static List<FormFieldDto> accountFields() {
        List<FormFieldDto> fields = new ArrayList<>();
        fields.add(heading("h-cuenta", "Datos de la cuenta"));
        fields.add(field(FIELD_FIRST_NAME, FormFieldType.TEXT, "Nombre", true, "Tu nombre"));
        fields.add(field(FIELD_LAST_NAME, FormFieldType.TEXT, "Apellido", true, "Tu apellido"));
        fields.add(field(FIELD_EMAIL, FormFieldType.EMAIL, "Correo electrónico", true, "usuario@correo.com"));
        fields.add(field(FIELD_NATIONAL_ID, FormFieldType.TEXT, "Cédula de identidad", true, "9 dígitos"));
        fields.add(field(FIELD_WHATSAPP, FormFieldType.PHONE, "WhatsApp", true, "8 dígitos"));
        fields.add(new FormFieldDto(
                FIELD_PASSWORD,
                FormFieldType.TEXT,
                "Contraseña (opcional)",
                "Déjala vacía para usar la contraseña por defecto",
                "Si no la indicas, se usará la contraseña por defecto del gimnasio.",
                false,
                List.of(),
                null,
                null
        ));
        fields.add(new FormFieldDto(
                FIELD_MEMBERSHIP,
                FormFieldType.SELECT,
                "Plan de membresía",
                null,
                "Elige el plan con el que deseas ingresar",
                true,
                List.of(),
                null,
                null
        ));
        return fields;
    }

    public static List<FormFieldDto> defaultFields() {
        return accountFields();
    }

    private static FormFieldDto heading(String id, String label) {
        return new FormFieldDto(id, FormFieldType.HEADING, label, null, null, false, List.of(), null, null);
    }

    private static FormFieldDto field(
            String id, FormFieldType type, String label, boolean required, String placeholder) {
        return new FormFieldDto(id, type, label, placeholder, null, required, List.of(), null, null);
    }
}
