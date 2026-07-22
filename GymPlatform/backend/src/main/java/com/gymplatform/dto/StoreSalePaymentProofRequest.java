package com.gymplatform.dto;

import jakarta.validation.constraints.NotNull;

public record StoreSalePaymentProofRequest(
        /** Imagen del comprobante en data URL (data:image/...;base64,...) */
        @NotNull String paymentProofData
) {}
