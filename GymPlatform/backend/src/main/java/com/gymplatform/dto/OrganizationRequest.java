package com.gymplatform.dto;

import com.gymplatform.domain.enums.SubscriptionStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record OrganizationRequest(
        @NotBlank String name,
        @NotBlank String slug,
        @NotBlank String ownerFirstName,
        @NotBlank String ownerLastName,
        @NotBlank @Email String ownerEmail,
        @NotBlank @Schema(description = "Cédula del administrador (9 dígitos). También sirve para iniciar sesión.")
        String ownerNationalId,
        @Schema(description = "Contraseña de acceso del administrador. Si se omite, se usa 12345678")
        String ownerPassword,
        String contactEmail,
        String contactPhone,
        SubscriptionStatus subscriptionStatus
) {}
