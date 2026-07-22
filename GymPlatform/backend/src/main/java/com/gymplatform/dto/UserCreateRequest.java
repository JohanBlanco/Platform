package com.gymplatform.dto;

import com.gymplatform.domain.enums.Role;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record UserCreateRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank @Email String email,
        @Schema(description = "Opcional. Si se omite o está vacío, se usa 12345678")
        String password,
        @NotEmpty @Schema(description = "Roles del usuario: GYM_OWNER (Admin), RECEPTIONIST, INSTRUCTOR, MEMBER")
        List<Role> roles,
        Integer birthYear,
        Integer age,
        String goals,
        String phone,
        Long membershipPackageId,
        @Schema(description = "Obligatoria. 9 dígitos numéricos. Sirve para iniciar sesión.")
        @NotBlank String nationalId,
        @Schema(description = "Número local de WhatsApp (8 dígitos, Costa Rica).")
        String whatsappPhone,
        @Schema(description = "Si true (por defecto), incluye el formulario de registro en los mensajes WhatsApp al crear.")
        Boolean sendRegistrationForm,
        @Schema(description = "IDs de plantillas de difusión a enviar (p. ej. bienvenida del plan). Orden: bienvenida primero si está incluida.")
        List<Long> broadcastTemplateIds
) {}
