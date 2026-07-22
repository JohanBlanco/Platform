package com.gymplatform.dto;

import com.gymplatform.domain.enums.FormFolderKind;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;

public record FormFolderRequest(
        @NotBlank String name
) {}
