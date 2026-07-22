package com.gymplatform.dto;

import com.gymplatform.domain.enums.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record StoreCheckoutRequest(
        Long memberId,
        String notes,
        /**
         * Pagos (pueden combinar efectivo, tarjeta y SINPE).
         * Compatibilidad: si viene vacío/null, se acepta paymentMethod único.
         */
        @Valid List<StoreCheckoutPaymentRequest> payments,
        /** Compatibilidad hacia atrás: un solo método. */
        PaymentMethod paymentMethod,
        String paymentProofData,
        @NotNull @NotEmpty @Valid List<StoreCheckoutItemRequest> items
) {}
