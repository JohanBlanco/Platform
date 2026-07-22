package com.gymplatform.dto;



import com.gymplatform.domain.enums.FormFieldType;

import java.util.List;



public record FormFieldDto(

        String id,

        FormFieldType type,

        String label,

        String placeholder,

        String helpText,

        boolean required,

        List<String> options,

        String visibilityFieldId,

        String visibilityValue

) {

    public FormFieldDto {

        options = options != null ? options : List.of();

    }

}

