package com.gymplatform.util;



import com.gymplatform.domain.enums.FormFieldType;

import com.gymplatform.dto.FormFieldDto;

import java.util.ArrayList;

import java.util.List;



public final class MemberRegistrationFormFactory {



    public static final String SLUG = "registro-miembro";

    public static final String TITLE = "Registro e historial del miembro";

    public static final String DESCRIPTION =

            "Hoja de ingreso al gimnasio. Complete con datos verídicos para su expediente "

                    + "y para orientar de forma segura su entrenamiento.";



    private static final String MINOR_FIELD = "f-es-menor";

    private static final String MINOR_VALUE = "Sí";



    private MemberRegistrationFormFactory() {}



    public static List<FormFieldDto> defaultFields() {

        List<FormFieldDto> fields = new ArrayList<>();

        fields.add(heading("h-datos", "Datos generales"));

        fields.add(field("f-nombre", FormFieldType.TEXT, "Nombre completo", true,

                "Como aparece en su identificación"));

        fields.add(field("f-nacimiento", FormFieldType.DATE, "Fecha de nacimiento", true, null));

        fields.add(field("f-edad", FormFieldType.NUMBER, "Edad", false, null));

        fields.add(select("f-id-tipo", "Tipo de identificación", false,

                "Cédula nacional", "DIMEX", "Pasaporte", "Otro"));

        fields.add(field("f-id-num", FormFieldType.TEXT, "Número de identificación", false, null));

        fields.add(field("f-nacionalidad", FormFieldType.TEXT, "Nacionalidad", false, "Ej. Costarricense"));

        fields.add(field("f-direccion", FormFieldType.TEXT, "Dirección de habitación", true, null));

        fields.add(field("f-ocupacion", FormFieldType.TEXT, "Ocupación o actividad", false, null));

        fields.add(field("f-tel-adicional", FormFieldType.PHONE, "Teléfono adicional", false, "8 dígitos"));

        fields.add(field("f-email-alt", FormFieldType.EMAIL, "Correo electrónico alterno", false, null));



        fields.add(heading("h-menor", "Menor de edad"));

        fields.add(radio(MINOR_FIELD, "¿Es menor de edad?", true, "Sí", "No"));

        fields.add(whenMinor(field("f-tutor-nombre", FormFieldType.TEXT,

                "Nombre del padre, madre o tutor legal", true, null)));

        fields.add(whenMinor(field("f-tutor-id", FormFieldType.TEXT, "Identificación del tutor", true, null)));

        fields.add(whenMinor(field("f-tutor-tel", FormFieldType.PHONE, "Teléfono del tutor", true, "8 dígitos")));



        fields.add(heading("h-emergencia", "Contacto de emergencia"));

        fields.add(field("f-emerg-nombre", FormFieldType.TEXT, "Nombre completo", true, null));

        fields.add(field("f-emerg-parentesco", FormFieldType.TEXT, "Parentesco", true, "Ej. Esposo/a, madre, amigo"));

        fields.add(field("f-emerg-tel", FormFieldType.PHONE, "Teléfono de emergencia", true, "8 dígitos"));



        fields.add(heading("h-salud", "Historial de salud"));

        fields.add(radio("f-enfermedad", "¿Padece alguna enfermedad crónica?", true, "Sí", "No"));

        fields.add(textarea("f-enfermedad-det", "Detalle de enfermedades o condiciones médicas", false,

                "Diabetes, hipertensión, asma, etc."));

        fields.add(radio("f-cirugia", "¿Ha tenido cirugías en los últimos 12 meses?", true, "Sí", "No"));

        fields.add(textarea("f-cirugia-det", "Detalle de cirugías recientes", false, null));

        fields.add(textarea("f-medicamentos", "Medicamentos que toma actualmente", false, null));

        fields.add(textarea("f-lesiones", "Lesiones, dolores o limitaciones físicas actuales", false,

                "Rodilla, espalda, hombro, etc."));

        fields.add(radio("f-embarazo", "¿Está embarazada o en periodo de lactancia?", true,

                "Sí", "No", "No aplica"));

        fields.add(radio("f-cardiaco", "¿Ha tenido problemas cardíacos o presión arterial alta?", true,

                "Sí", "No", "No sé"));



        fields.add(heading("h-actividad", "Actividad física"));

        fields.add(radio("f-ejercicio-previo", "¿Realizaba actividad física antes de ingresar?", true, "Sí", "No"));

        fields.add(textarea("f-ejercicio-det", "Tipo de ejercicio y frecuencia anterior", false,

                "Gym, running, natación…"));

        fields.add(textarea("f-objetivos", "Objetivos principales en el gimnasio", true,

                "Bajar peso, ganar masa, salud general…"));

        fields.add(select("f-nivel", "Nivel de condición física", true,

                "Principiante", "Intermedio", "Avanzado"));



        fields.add(heading("h-autorizaciones", "Autorizaciones"));

        fields.add(checkbox("f-declaracion", "Declaro que la información proporcionada es verídica", true));

        fields.add(checkbox("f-exoneracion",

                "Autorizo participar bajo mi responsabilidad y exonero al gimnasio conforme a sus políticas internas",

                true));

        fields.add(checkbox("f-imagen", "Autorizo el uso de mi imagen en redes y material del gimnasio", false));



        fields.add(heading("h-firmas", "Firmas"));

        fields.add(signature("f-firma-miembro", "Firma del miembro", true,

                "Firme con el mouse o el dedo en el recuadro"));

        fields.add(whenMinor(heading("h-firma-tutor", "Firma del encargado legal (menor de edad)")));

        fields.add(whenMinor(signature("f-firma-tutor", "Firma del padre, madre o tutor legal", true,

                "El encargado legal debe firmar si el miembro es menor de edad")));



        return fields;

    }



    private static FormFieldDto whenMinor(FormFieldDto field) {

        return withVisibility(field, MINOR_FIELD, MINOR_VALUE);

    }



    private static FormFieldDto withVisibility(FormFieldDto field, String whenFieldId, String whenValue) {

        return new FormFieldDto(

                field.id(),

                field.type(),

                field.label(),

                field.placeholder(),

                field.helpText(),

                field.required(),

                field.options(),

                whenFieldId,

                whenValue

        );

    }



    private static FormFieldDto heading(String id, String label) {

        return new FormFieldDto(id, FormFieldType.HEADING, label, null, null, false, List.of(), null, null);

    }



    private static FormFieldDto field(String id, FormFieldType type, String label, boolean required, String placeholder) {

        return new FormFieldDto(id, type, label, placeholder, null, required, List.of(), null, null);

    }



    private static FormFieldDto textarea(String id, String label, boolean required, String placeholder) {

        return new FormFieldDto(id, FormFieldType.TEXTAREA, label, placeholder, null, required, List.of(), null, null);

    }



    private static FormFieldDto select(String id, String label, boolean required, String... options) {

        return new FormFieldDto(id, FormFieldType.SELECT, label, null, null, required, List.of(options), null, null);

    }



    private static FormFieldDto radio(String id, String label, boolean required, String... options) {

        return new FormFieldDto(id, FormFieldType.RADIO, label, null, null, required, List.of(options), null, null);

    }



    private static FormFieldDto checkbox(String id, String label, boolean required) {

        return new FormFieldDto(id, FormFieldType.CHECKBOX, label, null, null, required, List.of(), null, null);

    }



    private static FormFieldDto signature(String id, String label, boolean required, String helpText) {

        return new FormFieldDto(id, FormFieldType.SIGNATURE, label, null, helpText, required, List.of(), null, null);

    }

}

