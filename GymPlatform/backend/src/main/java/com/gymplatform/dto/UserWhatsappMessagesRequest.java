package com.gymplatform.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record UserWhatsappMessagesRequest(
        @NotNull Boolean sendRegistrationForm,
        List<Long> templateIds
) {}
