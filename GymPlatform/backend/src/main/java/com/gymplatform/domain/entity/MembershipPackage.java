package com.gymplatform.domain.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "membership_packages")
public class MembershipPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    /** Si true, se suma I.V.A. sobre el precio base al vender. */
    @Column(nullable = false)
    private boolean applyIva = false;

    @Column(precision = 7, scale = 2)
    private BigDecimal ivaPercent;

    @Column(nullable = false)
    private int durationMonths = 1;

    /** null = actividades gratuitas ilimitadas incluidas en la membresía */
    private Integer freeActivityQuota;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @OneToMany(mappedBy = "membershipPackage", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PackageAddon> addons = new ArrayList<>();

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public boolean isApplyIva() { return applyIva; }
    public void setApplyIva(boolean applyIva) { this.applyIva = applyIva; }
    public BigDecimal getIvaPercent() { return ivaPercent; }
    public void setIvaPercent(BigDecimal ivaPercent) { this.ivaPercent = ivaPercent; }
    public int getDurationMonths() { return durationMonths; }
    public void setDurationMonths(int durationMonths) { this.durationMonths = durationMonths; }
    public Integer getFreeActivityQuota() { return freeActivityQuota; }
    public void setFreeActivityQuota(Integer freeActivityQuota) { this.freeActivityQuota = freeActivityQuota; }
    public Organization getOrganization() { return organization; }
    public void setOrganization(Organization organization) { this.organization = organization; }
    public List<PackageAddon> getAddons() { return addons; }
    public void setAddons(List<PackageAddon> addons) { this.addons = addons; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
