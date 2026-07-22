package com.gymplatform.dto;

import com.gymplatform.domain.enums.PaymentMethod;

import java.math.BigDecimal;

public record StoreSalePaymentResponse(
        Long id,
        PaymentMethod method,
        BigDecimal amount,
        boolean hasPaymentProof
) {}
