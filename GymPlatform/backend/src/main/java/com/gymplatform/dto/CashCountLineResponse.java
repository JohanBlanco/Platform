package com.gymplatform.dto;

import java.math.BigDecimal;

public record CashCountLineResponse(int valueColones, int quantity, BigDecimal subtotal) {}
