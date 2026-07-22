package com.gymplatform.dto;

import com.gymplatform.domain.enums.PaymentMethod;
import com.gymplatform.domain.enums.StoreSaleType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record StoreSaleResponse(
        Long id,
        StoreSaleType type,
        Instant createdAt,
        BigDecimal total,
        String notes,
        Long memberId,
        String memberName,
        String createdByName,
        Long cashSessionId,
        /** Compatibilidad: primer método o único histórico. */
        PaymentMethod paymentMethod,
        boolean hasPaymentProof,
        /** Monto en efectivo que afecta caja (0 si solo tarjeta/SINPE). */
        BigDecimal cashAmount,
        List<StoreSalePaymentResponse> payments,
        List<StoreSaleItemResponse> items,
        boolean voided,
        /** Se puede eliminar mientras la caja del movimiento siga abierta. */
        boolean deletable
) {}
