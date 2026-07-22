package com.gymplatform.dto;

public record ProductCategoryResponse(
        Long id,
        String name,
        String slug,
        String description,
        int sortOrder
) {}
