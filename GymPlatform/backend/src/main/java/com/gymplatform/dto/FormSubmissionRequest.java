package com.gymplatform.dto;

import jakarta.validation.constraints.NotNull;
import java.util.Map;

public record FormSubmissionRequest(
        @NotNull Map<String, Object> answers,
        Long memberUserId
) {}
