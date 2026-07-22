package com.gymplatform.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Instructor disponible para preferencia en solicitudes")
public record InstructorOptionResponse(
        Long id,
        String firstName,
        String lastName
) {
    public String fullName() {
        return (firstName + " " + lastName).trim();
    }
}
