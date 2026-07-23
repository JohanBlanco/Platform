package com.gymplatform.controller;

import com.gymplatform.dto.StatisticsAccessChangeRequest;
import com.gymplatform.dto.StatisticsAccessResponse;
import com.gymplatform.dto.StatisticsAccessSetRequest;
import com.gymplatform.dto.StatisticsDashboardResponse;
import com.gymplatform.dto.StatisticsUnlockRequest;
import com.gymplatform.dto.StatisticsUnlockResponse;
import com.gymplatform.service.StatisticsAccessService;
import com.gymplatform.service.StatisticsDashboardService;
import com.gymplatform.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/statistics")
@Tag(name = "Estadísticas")
public class StatisticsController {

    private final StatisticsAccessService accessService;
    private final StatisticsDashboardService dashboardService;

    public StatisticsController(
            StatisticsAccessService accessService,
            StatisticsDashboardService dashboardService) {
        this.accessService = accessService;
        this.dashboardService = dashboardService;
    }

    @Operation(summary = "Estado de la contraseña de áreas privadas (solo admin)")
    @GetMapping("/access")
    public StatisticsAccessResponse getAccess() {
        return accessService.getAccess(SecurityUtils.requireOrganizationId());
    }

    @Operation(summary = "Definir contraseña de áreas privadas por primera vez (solo admin)")
    @PutMapping("/access")
    public StatisticsAccessResponse setAccess(@Valid @RequestBody StatisticsAccessSetRequest request) {
        return accessService.setPassword(SecurityUtils.requireOrganizationId(), request);
    }

    @Operation(summary = "Cambiar contraseña de áreas privadas (solo admin)")
    @PutMapping("/access/change")
    public StatisticsAccessResponse changeAccess(@Valid @RequestBody StatisticsAccessChangeRequest request) {
        return accessService.changePassword(SecurityUtils.requireOrganizationId(), request);
    }

    @Operation(summary = "Verificar contraseña de áreas privadas (sin emitir token)")
    @PostMapping("/access/verify")
    public void verifyAccess(@Valid @RequestBody StatisticsUnlockRequest request) {
        accessService.verifyAccessPassword(
                SecurityUtils.requireOrganizationId(),
                request.password());
    }

    @Operation(summary = "Desbloquear área privada (p. ej. dashboard de estadísticas)")
    @PostMapping("/unlock")
    public StatisticsUnlockResponse unlock(@Valid @RequestBody StatisticsUnlockRequest request) {
        return accessService.unlock(SecurityUtils.requireOrganizationId(), request);
    }

    @Operation(summary = "Dashboard financiero (requiere X-Stats-Unlock)")
    @GetMapping("/dashboard")
    public StatisticsDashboardResponse dashboard(
            @RequestParam(defaultValue = "month") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestHeader(value = "X-Stats-Unlock", required = false) String unlockToken) {
        return dashboardService.getDashboard(
                SecurityUtils.requireOrganizationId(),
                period,
                date,
                unlockToken);
    }
}
