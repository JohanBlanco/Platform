package com.gymplatform.domain.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(
        name = "products",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_product_org_code", columnNames = {"organization_id", "code_prefix"}),
                @UniqueConstraint(name = "uk_product_org_name", columnNames = {"organization_id", "name_normalized"})
        }
)
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "product_category_links",
            joinColumns = @JoinColumn(name = "product_id"),
            inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    private java.util.Set<ProductCategory> categories = new java.util.LinkedHashSet<>();

    @Column(nullable = false)
    private String name;

    /** Nombre en minúsculas para unicidad case-insensitive. */
    @Column(name = "name_normalized", nullable = false, length = 200)
    private String nameNormalized;

    /**
     * Prefijo único del código (tipo código de barras sencillo), p. ej. CHICLE.
     * Derivado del nombre; único por gimnasio.
     */
    @Column(name = "code_prefix", nullable = false, length = 32)
    private String codePrefix;

    @Column(length = 1000)
    private String description;

    /** URL remota de imagen (referencia). */
    @Column(length = 1500)
    private String imageUrl;

    /** Unidades vendibles disponibles (chiclos, scoops, etc.). */
    @Column(nullable = false)
    private int stockUnits = 0;

    /** Cuántas unidades hay en un empaque (caja/tarro). Mínimo 1. */
    @Column(nullable = false)
    private int unitsPerPackage = 1;

    /** Etiqueta del empaque, p. ej. «caja», «tarro». */
    @Column(length = 40)
    private String packageLabel = "paquete";

    /** Etiqueta de la unidad, p. ej. «unidad», «scoop», «chicle». */
    @Column(length = 40)
    private String unitLabel = "unidad";

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal packagePrice = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice = BigDecimal.ZERO;

    /** Si true, se suma I.V.A. (u otro %) sobre el precio base al vender. */
    @Column(nullable = false)
    private boolean applyIva = false;

    /** Porcentaje de I.V.A. (ej. 13). Solo aplica si applyIva es true. */
    @Column(precision = 7, scale = 2)
    private BigDecimal ivaPercent;

    @Column(nullable = false)
    private boolean sellByPackage = true;

    @Column(nullable = false)
    private boolean sellByUnit = true;

    /** Descuento promocional 1–90. Null = sin oferta. */
    private Integer offerPercent;

    @Column(length = 40)
    private String offerBadge;

    private java.time.LocalDate offerFrom;

    private java.time.LocalDate offerUntil;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    private Instant updatedAt = Instant.now();

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Organization getOrganization() { return organization; }
    public void setOrganization(Organization organization) { this.organization = organization; }
    public java.util.Set<ProductCategory> getCategories() { return categories; }
    public void setCategories(java.util.Set<ProductCategory> categories) { this.categories = categories; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getNameNormalized() { return nameNormalized; }
    public void setNameNormalized(String nameNormalized) { this.nameNormalized = nameNormalized; }
    public String getCodePrefix() { return codePrefix; }
    public void setCodePrefix(String codePrefix) { this.codePrefix = codePrefix; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public int getStockUnits() { return stockUnits; }
    public void setStockUnits(int stockUnits) { this.stockUnits = stockUnits; }
    public int getUnitsPerPackage() { return unitsPerPackage; }
    public void setUnitsPerPackage(int unitsPerPackage) { this.unitsPerPackage = unitsPerPackage; }
    public String getPackageLabel() { return packageLabel; }
    public void setPackageLabel(String packageLabel) { this.packageLabel = packageLabel; }
    public String getUnitLabel() { return unitLabel; }
    public void setUnitLabel(String unitLabel) { this.unitLabel = unitLabel; }
    public BigDecimal getPackagePrice() { return packagePrice; }
    public void setPackagePrice(BigDecimal packagePrice) { this.packagePrice = packagePrice; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    public boolean isApplyIva() { return applyIva; }
    public void setApplyIva(boolean applyIva) { this.applyIva = applyIva; }
    public BigDecimal getIvaPercent() { return ivaPercent; }
    public void setIvaPercent(BigDecimal ivaPercent) { this.ivaPercent = ivaPercent; }
    public boolean isSellByPackage() { return sellByPackage; }
    public void setSellByPackage(boolean sellByPackage) { this.sellByPackage = sellByPackage; }
    public boolean isSellByUnit() { return sellByUnit; }
    public void setSellByUnit(boolean sellByUnit) { this.sellByUnit = sellByUnit; }
    public Integer getOfferPercent() { return offerPercent; }
    public void setOfferPercent(Integer offerPercent) { this.offerPercent = offerPercent; }
    public String getOfferBadge() { return offerBadge; }
    public void setOfferBadge(String offerBadge) { this.offerBadge = offerBadge; }
    public java.time.LocalDate getOfferFrom() { return offerFrom; }
    public void setOfferFrom(java.time.LocalDate offerFrom) { this.offerFrom = offerFrom; }
    public java.time.LocalDate getOfferUntil() { return offerUntil; }
    public void setOfferUntil(java.time.LocalDate offerUntil) { this.offerUntil = offerUntil; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public boolean isOutOfStock() {
        return stockUnits <= 0;
    }

    public int getFullPackagesAvailable() {
        if (unitsPerPackage <= 0) return 0;
        return stockUnits / unitsPerPackage;
    }
}
