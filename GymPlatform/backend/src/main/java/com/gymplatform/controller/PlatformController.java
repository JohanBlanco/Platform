package com.gymplatform.controller;

import com.gymplatform.dto.OrganizationRequest;
import com.gymplatform.dto.OrganizationResponse;
import com.gymplatform.service.OrganizationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@Tag(name = "Plataforma (deshabilitado)",
        description = "Gestión multi-gimnasio deshabilitada. El producto opera a nivel de un gimnasio.")
@RestController
@RequestMapping("/api/platform/organizations")
@Deprecated
public class PlatformController {

    private final OrganizationService organizationService;

    public PlatformController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    @Operation(summary = "Crear cliente (gimnasio)",
            description = "Registra la organización y crea un GYM_OWNER con ownerEmail/ownerPassword. "
                    + "Ese administrador inicia sesión en /api/auth/login y gestiona solo su gimnasio.")
    @PostMapping
    public OrganizationResponse create(@Valid @RequestBody OrganizationRequest request) {
        return organizationService.create(request);
    }

    @GetMapping
    public List<OrganizationResponse> findAll() {
        return organizationService.findAll();
    }

    @GetMapping("/{id}")
    public OrganizationResponse findById(@PathVariable Long id) {
        return organizationService.findById(id);
    }

    @PutMapping("/{id}")
    public OrganizationResponse update(@PathVariable Long id, @Valid @RequestBody OrganizationRequest request) {
        return organizationService.update(id, request);
    }
}
