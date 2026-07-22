package com.gymplatform.dto;

public record ForumResponse(
        Long id,
        String slug,
        String title,
        String description,
        long topicCount
) {}
