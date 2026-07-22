package com.gymplatform.dto;

import com.gymplatform.domain.enums.MuscleGroup;

public record ForumTopicDetailResponse(
        Long id,
        Long forumId,
        String forumSlug,
        Long exerciseId,
        String title,
        String imageUrl,
        String videoUrl,
        String sourceUrl,
        String bodyMarkdown,
        MuscleGroup muscleGroup
) {}
