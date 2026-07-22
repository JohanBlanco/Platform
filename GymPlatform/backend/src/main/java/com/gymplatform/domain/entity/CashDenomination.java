package com.gymplatform.domain.entity;

import com.gymplatform.domain.enums.CashDenominationKind;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "cash_denominations", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"organization_id", "value_colones"})
})
public class CashDenomination {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    private Organization organization;

    @Column(name = "value_colones", nullable = false)
    private int valueColones;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private CashDenominationKind kind;

    @Column(nullable = false)
    private int sortOrder = 0;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Organization getOrganization() { return organization; }
    public void setOrganization(Organization organization) { this.organization = organization; }
    public int getValueColones() { return valueColones; }
    public void setValueColones(int valueColones) { this.valueColones = valueColones; }
    public CashDenominationKind getKind() { return kind; }
    public void setKind(CashDenominationKind kind) { this.kind = kind; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Instant getCreatedAt() { return createdAt; }
}
