package com.gymplatform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

/** Envío de formulario / plantillas a un número que aún no es miembro del gym. */
public record GuestWhatsappMessagesRequest(
        @NotBlank String whatsappPhone,
        String firstName,
        @NotNull Boolean sendRegistrationForm,
        List<Long> templateIds
) {}
