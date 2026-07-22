package com.gymplatform.controller;

import com.gymplatform.domain.enums.SeasonTheme;
import com.gymplatform.dto.MediaUploadResponse;
import com.gymplatform.dto.ProductOfferUpdateRequest;
import com.gymplatform.dto.ProductResponse;
import com.gymplatform.dto.SeasonThemeUpdateRequest;
import com.gymplatform.exception.BusinessException;
import com.gymplatform.service.MarketingMediaService;
import com.gymplatform.service.OrganizationService;
import com.gymplatform.service.ProductService;
import com.gymplatform.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "Mercadeo", description = "Promociones, ofertas y decoración estacional")
@RestController
@RequestMapping("/api/marketing")
public class MarketingController {

    private final MarketingMediaService mediaService;
    private final ProductService productService;
    private final OrganizationService organizationService;

    public MarketingController(
            MarketingMediaService mediaService,
            ProductService productService,
            OrganizationService organizationService) {
        this.mediaService = mediaService;
        this.productService = productService;
        this.organizationService = organizationService;
    }

    @Operation(summary = "Subir imagen de mercadeo (JPG/PNG/WEBP/GIF, máx. 4 MB)")
    @PostMapping(value = "/media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public MediaUploadResponse uploadMedia(@RequestPart("file") MultipartFile file) {
        requireMarketingManager();
        return mediaService.store(file);
    }

    @Operation(summary = "Temas estacionales disponibles")
    @GetMapping("/season-themes")
    public List<Map<String, String>> listSeasonThemes() {
        requireMarketingManager();
        return Arrays.stream(SeasonTheme.values())
                .map(theme -> {
                    Map<String, String> row = new LinkedHashMap<>();
                    row.put("id", theme.name());
                    row.put("label", labelFor(theme));
                    return row;
                })
                .toList();
    }

    @Operation(summary = "Actualizar decoración del mes del gimnasio")
    @PutMapping("/season")
    public Map<String, String> updateSeason(@Valid @RequestBody SeasonThemeUpdateRequest request) {
        requireMarketingManager();
        String theme = organizationService.updateSeasonTheme(
                SecurityUtils.requireOrganizationId(), request.seasonTheme());
        return Map.of("seasonTheme", theme);
    }

    @Operation(summary = "Configurar oferta / descuento de un producto")
    @PutMapping("/products/{id}/offer")
    public ProductResponse updateProductOffer(
            @PathVariable Long id,
            @Valid @RequestBody ProductOfferUpdateRequest request) {
        requireMarketingManager();
        return productService.updateOffer(SecurityUtils.requireOrganizationId(), id, request);
    }

    @Operation(summary = "Quitar oferta de un producto")
    @DeleteMapping("/products/{id}/offer")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clearProductOffer(@PathVariable Long id) {
        requireMarketingManager();
        productService.clearOffer(SecurityUtils.requireOrganizationId(), id);
    }

    private void requireMarketingManager() {
        var user = SecurityUtils.currentUser();
        if (!user.hasRole("GYM_OWNER") && !user.hasRole("RECEPTIONIST")) {
            throw new BusinessException("Solo administración o recepción pueden gestionar mercadeo");
        }
    }

    private static String labelFor(SeasonTheme theme) {
        return switch (theme) {
            case NONE -> "Sin decoración";
            case VALENTINE -> "Día de los enamorados";
            case EASTER -> "Semana Santa / Pascua";
            case SUMMER -> "Verano";
            case HALLOWEEN -> "Halloween";
            case CHRISTMAS -> "Navidad";
            case NEW_YEAR -> "Año nuevo";
            case MOTHERS_DAY -> "Día de la madre";
            case FATHERS_DAY -> "Día del padre";
            case INDEPENDENCE_CR -> "Independencia (CR)";
            case BACK_TO_SCHOOL -> "Regreso a clases";
        };
    }
}
