package com.gymplatform.dto;

import com.gymplatform.domain.enums.StoreSaleItemKind;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record StoreCheckoutItemRequest(
        Long productId,
        Long membershipPackageId,
        @NotNull StoreSaleItemKind kind,
        @Min(1) int quantity,
        /** Solo aplica si el producto no trae I.V.A. incluido en catálogo. */
        Boolean applyIva
) {}
