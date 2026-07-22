package com.gymplatform.controller;

import com.gymplatform.dto.FormSubmissionRequest;
import com.gymplatform.dto.FormSubmissionResponse;
import com.gymplatform.dto.OrganizationResponse;
import com.gymplatform.dto.PublicFormResponse;
import com.gymplatform.security.UserPrincipal;
import com.gymplatform.service.CustomFormService;
import com.gymplatform.service.OrganizationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@Tag(name = "Público", description = "Endpoints sin autenticación")
@RestController
@RequestMapping("/api/public")
public class PublicController {

    private final OrganizationService organizationService;
    private final CustomFormService customFormService;

    public PublicController(OrganizationService organizationService, CustomFormService customFormService) {
        this.organizationService = organizationService;
        this.customFormService = customFormService;
    }

    @GetMapping("/organizations")
    public List<OrganizationResponse> listActiveOrganizations() {
        return organizationService.findActiveOrganizations();
    }

    @Operation(summary = "Obtener formulario público o metadatos si requiere autenticación")
    @GetMapping("/forms/{organizationSlug}/{formSlug}")
    public PublicFormResponse getPublicForm(
            @PathVariable String organizationSlug,
            @PathVariable String formSlug) {
        return customFormService.getPublicForm(organizationSlug, formSlug, isAuthenticated());
    }

    @Operation(summary = "Enviar respuestas de formulario público")
    @PostMapping("/forms/{organizationSlug}/{formSlug}/submit")
    @ResponseStatus(HttpStatus.CREATED)
    public FormSubmissionResponse submitPublicForm(
            @PathVariable String organizationSlug,
            @PathVariable String formSlug,
            @Valid @RequestBody FormSubmissionRequest request) {
        return customFormService.submitPublicForm(organizationSlug, formSlug, request);
    }

    private boolean isAuthenticated() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getPrincipal() instanceof UserPrincipal;
    }
}
