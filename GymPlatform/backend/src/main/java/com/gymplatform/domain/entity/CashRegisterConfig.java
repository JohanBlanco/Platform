package com.gymplatform.domain.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "cash_register_configs", uniqueConstraints = {
        @UniqueConstraint(columnNames = "organization_id")
})
public class CashRegisterConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", unique = true)
    private Organization organization;

    /** Fondo esperado al abrir caja (colones). */
    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal openingFloatColones = new BigDecimal("45000");

    /** Porcentaje de I.V.A. de referencia del gimnasio (ej. 13). */
    @Column(name = "system_iva_percent", nullable = false, precision = 7, scale = 2)
    private BigDecimal systemIvaPercent = new BigDecimal("13");

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
    public BigDecimal getOpeningFloatColones() { return openingFloatColones; }
    public void setOpeningFloatColones(BigDecimal openingFloatColones) { this.openingFloatColones = openingFloatColones; }
    public BigDecimal getSystemIvaPercent() { return systemIvaPercent; }
    public void setSystemIvaPercent(BigDecimal systemIvaPercent) { this.systemIvaPercent = systemIvaPercent; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
