package com.gymplatform.dto;

import java.time.Instant;

public record StatisticsUnlockResponse(String unlockToken, Instant expiresAt) {}
