package com.gymplatform.controller;

import com.gymplatform.dto.*;
import com.gymplatform.service.CashRegisterService;
import com.gymplatform.service.StoreSaleService;
import com.gymplatform.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Tag(name = "Tienda y caja", description = "Punto de venta, caja diaria e historial de ventas")
@RestController
@RequestMapping("/api")
public class StoreController {

    private final CashRegisterService cashRegisterService;
    private final StoreSaleService storeSaleService;

    public StoreController(CashRegisterService cashRegisterService, StoreSaleService storeSaleService) {
        this.cashRegisterService = cashRegisterService;
        this.storeSaleService = storeSaleService;
    }

    @Operation(summary = "Configuración completa de caja (fondo + denominaciones)")
    @GetMapping("/cash/settings")
    public CashSettingsResponse getCashSettings() {
        return cashRegisterService.getSettings(SecurityUtils.requireOrganizationId());
    }

    @Operation(summary = "Actualizar fondo de caja y denominaciones")
    @PutMapping("/cash/settings")
    public CashSettingsResponse updateCashSettings(@Valid @RequestBody CashSettingsUpdateRequest request) {
        return cashRegisterService.updateSettings(SecurityUtils.requireOrganizationId(), request);
    }

    @Operation(summary = "Listar denominaciones de caja (configuración)")
    @GetMapping("/cash/denominations")
    public List<CashDenominationResponse> listDenominations() {
        return cashRegisterService.listDenominations(SecurityUtils.requireOrganizationId());
    }

    @Operation(summary = "Listar denominaciones activas para conteo")
    @GetMapping("/cash/denominations/active")
    public List<CashDenominationResponse> listActiveDenominations() {
        return cashRegisterService.listActiveDenominations(SecurityUtils.requireOrganizationId());
    }

    @Operation(summary = "Reemplazar configuración de denominaciones")
    @PutMapping("/cash/denominations")
    public List<CashDenominationResponse> replaceDenominations(@Valid @RequestBody CashDenominationsReplaceRequest request) {
        return cashRegisterService.replaceDenominations(SecurityUtils.requireOrganizationId(), request);
    }

    @Operation(summary = "Fondo de caja e I.V.A. de referencia del sistema")
    @GetMapping("/cash/opening-float")
    public java.util.Map<String, java.math.BigDecimal> openingFloat() {
        Long orgId = SecurityUtils.requireOrganizationId();
        return java.util.Map.of(
                "openingFloatColones",
                cashRegisterService.getOpeningFloat(orgId),
                "systemIvaPercent",
                cashRegisterService.getSystemIvaPercent(orgId)
        );
    }

    @Operation(summary = "Obtener caja abierta actual")
    @GetMapping("/cash/session/current")
    public CashSessionResponse currentSession() {
        return cashRegisterService.getCurrentSession(SecurityUtils.requireOrganizationId());
    }

    @Operation(summary = "Listar aperturas de caja de un día (fecha y hora de cada turno)")
    @GetMapping("/cash/sessions")
    public List<CashSessionResponse> listSessionsForDay(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return cashRegisterService.listSessionsForDay(SecurityUtils.requireOrganizationId(), date);
    }

    @Operation(summary = "Abrir caja (registra fecha y hora de apertura)")
    @PostMapping("/cash/session/open")
    @ResponseStatus(HttpStatus.CREATED)
    public CashSessionResponse openSession(@Valid @RequestBody CashSessionOpenRequest request) {
        return cashRegisterService.openSession(
                SecurityUtils.requireOrganizationId(),
                SecurityUtils.currentUser().getId(),
                request
        );
    }

    @Operation(summary = "Cerrar caja (registra fecha y hora de cierre)")
    @PostMapping("/cash/session/{id}/close")
    public CashSessionResponse closeSession(
            @PathVariable Long id,
            @Valid @RequestBody CashSessionCloseRequest request
    ) {
        return cashRegisterService.closeSession(
                SecurityUtils.requireOrganizationId(),
                SecurityUtils.currentUser().getId(),
                id,
                request
        );
    }

    @Operation(summary = "Cobrar venta en punto de venta")
    @PostMapping("/store/checkout")
    @ResponseStatus(HttpStatus.CREATED)
    public StoreSaleResponse checkout(@Valid @RequestBody StoreCheckoutRequest request) {
        return storeSaleService.checkout(
                SecurityUtils.requireOrganizationId(),
                SecurityUtils.currentUser().getId(),
                request
        );
    }

    @Operation(summary = "Registrar ingreso o gasto manual")
    @PostMapping("/store/manual-entry")
    @ResponseStatus(HttpStatus.CREATED)
    public StoreSaleResponse manualEntry(@Valid @RequestBody StoreManualEntryRequest request) {
        return storeSaleService.createManualEntry(
                SecurityUtils.requireOrganizationId(),
                SecurityUtils.currentUser().getId(),
                request
        );
    }

    @Operation(summary = "Historial de ventas por día, mes o año")
    @GetMapping("/store/sales")
    public List<StoreSaleResponse> listSales(
            @RequestParam(defaultValue = "day") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return storeSaleService.listSales(SecurityUtils.requireOrganizationId(), period, date);
    }

    @Operation(summary = "Resumen de ventas del periodo")
    @GetMapping("/store/sales/summary")
    public StoreSalesSummaryResponse salesSummary(
            @RequestParam(defaultValue = "day") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return storeSaleService.summarize(SecurityUtils.requireOrganizationId(), period, date);
    }

    @Operation(summary = "Reporte del día: cada caja por separado y total del día (suma de todas)")
    @GetMapping("/store/sales/day-report")
    public CashDayReportResponse dayReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return storeSaleService.dayReport(SecurityUtils.requireOrganizationId(), date);
    }

    @Operation(summary = "Eliminar (anular) un movimiento mientras la caja esté abierta")
    @DeleteMapping("/store/sales/{id}")
    public StoreSaleResponse voidSale(@PathVariable Long id) {
        return storeSaleService.voidSale(
                SecurityUtils.requireOrganizationId(),
                id,
                SecurityUtils.currentUser().getId()
        );
    }

    @Operation(summary = "Adjuntar comprobante SINPE a una venta")
    @PutMapping("/store/sales/{id}/payment-proof")
    public StoreSaleResponse attachPaymentProof(
            @PathVariable Long id,
            @Valid @RequestBody StoreSalePaymentProofRequest request
    ) {
        return storeSaleService.attachPaymentProof(SecurityUtils.requireOrganizationId(), id, request);
    }

    @Operation(summary = "Obtener imagen del comprobante de pago")
    @GetMapping("/store/sales/{id}/payment-proof")
    public java.util.Map<String, String> getPaymentProof(@PathVariable Long id) {
        return java.util.Map.of(
                "paymentProofData",
                storeSaleService.getPaymentProofData(SecurityUtils.requireOrganizationId(), id)
        );
    }
}
