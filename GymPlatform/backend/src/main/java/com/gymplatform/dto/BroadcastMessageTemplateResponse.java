package com.gymplatform.dto;

import com.gymplatform.domain.enums.BroadcastChannel;
import com.gymplatform.domain.enums.BroadcastTemplatePurpose;
import java.time.Instant;
import java.util.List;

public record BroadcastMessageTemplateResponse(
        Long id,
        BroadcastChannel channel,
        String name,
        String body,
        BroadcastTemplatePurpose purpose,
        Long membershipPackageId,
        String membershipPackageName,
        List<String> mediaLinks,
        Instant createdAt,
        Instant updatedAt
) {}
