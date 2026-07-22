package com.gymplatform.controller;

import com.gymplatform.dto.LoginRequest;
import com.gymplatform.dto.AuthResponse;
import com.gymplatform.dto.UserCreateRequest;
import com.gymplatform.dto.UserResponse;
import com.gymplatform.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.gymplatform.security.UserPrincipal;

@Tag(name = "Autenticación", description = "Login y registro de miembros")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @Operation(summary = "Iniciar sesión",
            description = "Todos los usuarios pueden entrar con correo electrónico o cédula (9 dígitos) y contraseña.")
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public AuthResponse me(@AuthenticationPrincipal UserPrincipal principal) {
        return authService.currentSession(principal);
    }

    @PostMapping("/register/{organizationId}")
    public UserResponse register(@PathVariable Long organizationId, @Valid @RequestBody UserCreateRequest request) {
        return authService.registerMember(request, organizationId);
    }
}
