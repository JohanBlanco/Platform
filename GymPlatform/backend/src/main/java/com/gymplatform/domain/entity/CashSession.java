package com.gymplatform.domain.entity;

import com.gymplatform.domain.enums.CashSessionStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "cash_sessions")
public class CashSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    private Organization organization;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "opened_by_user_id")
    private User openedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "closed_by_user_id")
    private User closedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private CashSessionStatus status = CashSessionStatus.OPEN;

    @Column(nullable = false)
    private Instant openedAt = Instant.now();

    private Instant closedAt;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal openingTotal = BigDecimal.ZERO;

    @Column(precision = 14, scale = 2)
    private BigDecimal closingTotal;

    @Column(precision = 14, scale = 2)
    private BigDecimal expectedClosingTotal;

    @Column(length = 500)
    private String notes;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Organization getOrganization() { return organization; }
    public void setOrganization(Organization organization) { this.organization = organization; }
    public User getOpenedBy() { return openedBy; }
    public void setOpenedBy(User openedBy) { this.openedBy = openedBy; }
    public User getClosedBy() { return closedBy; }
    public void setClosedBy(User closedBy) { this.closedBy = closedBy; }
    public CashSessionStatus getStatus() { return status; }
    public void setStatus(CashSessionStatus status) { this.status = status; }
    public Instant getOpenedAt() { return openedAt; }
    public void setOpenedAt(Instant openedAt) { this.openedAt = openedAt; }
    public Instant getClosedAt() { return closedAt; }
    public void setClosedAt(Instant closedAt) { this.closedAt = closedAt; }
    public BigDecimal getOpeningTotal() { return openingTotal; }
    public void setOpeningTotal(BigDecimal openingTotal) { this.openingTotal = openingTotal; }
    public BigDecimal getClosingTotal() { return closingTotal; }
    public void setClosingTotal(BigDecimal closingTotal) { this.closingTotal = closingTotal; }
    public BigDecimal getExpectedClosingTotal() { return expectedClosingTotal; }
    public void setExpectedClosingTotal(BigDecimal expectedClosingTotal) { this.expectedClosingTotal = expectedClosingTotal; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
