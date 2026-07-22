package com.gymplatform.domain.entity;

import com.gymplatform.domain.enums.PaymentMethod;
import com.gymplatform.domain.enums.StoreSaleType;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "store_sales")
public class StoreSale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cash_session_id")
    private CashSession cashSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private User member;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private User createdBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private StoreSaleType type = StoreSaleType.SALE;

    /** Método legado (un solo pago). Preferir store_sale_payments. */
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 16)
    private PaymentMethod paymentMethod;

    /** Comprobante legado SINPE. Preferir store_sale_payments. */
    @Column(name = "payment_proof_data", columnDefinition = "TEXT")
    private String paymentProofData;

    @OneToMany(mappedBy = "storeSale", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<StoreSalePayment> payments = new ArrayList<>();

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal total = BigDecimal.ZERO;

    @Column(length = 500)
    private String notes;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    /** Anulación suave (solo con caja abierta). */
    private Instant voidedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voided_by_user_id")
    private User voidedBy;

    @Column(length = 300)
    private String voidReason;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Organization getOrganization() { return organization; }
    public void setOrganization(Organization organization) { this.organization = organization; }
    public CashSession getCashSession() { return cashSession; }
    public void setCashSession(CashSession cashSession) { this.cashSession = cashSession; }
    public User getMember() { return member; }
    public void setMember(User member) { this.member = member; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public StoreSaleType getType() { return type; }
    public void setType(StoreSaleType type) { this.type = type; }
    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getPaymentProofData() { return paymentProofData; }
    public void setPaymentProofData(String paymentProofData) { this.paymentProofData = paymentProofData; }
    public List<StoreSalePayment> getPayments() { return payments; }
    public void setPayments(List<StoreSalePayment> payments) { this.payments = payments; }
    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getVoidedAt() { return voidedAt; }
    public void setVoidedAt(Instant voidedAt) { this.voidedAt = voidedAt; }
    public User getVoidedBy() { return voidedBy; }
    public void setVoidedBy(User voidedBy) { this.voidedBy = voidedBy; }
    public String getVoidReason() { return voidReason; }
    public void setVoidReason(String voidReason) { this.voidReason = voidReason; }

    public boolean isVoided() {
        return voidedAt != null;
    }

    public void addPayment(StoreSalePayment payment) {
        payment.setStoreSale(this);
        payments.add(payment);
    }

    /** Efectivo que entra a la caja física. */
    public BigDecimal cashDrawerAmount() {
        if (type == StoreSaleType.MANUAL_INCOME) {
            return total != null ? total : BigDecimal.ZERO;
        }
        if (type == StoreSaleType.MANUAL_EXPENSE) {
            return total != null ? total : BigDecimal.ZERO;
        }
        if (payments != null && !payments.isEmpty()) {
            return payments.stream()
                    .filter(p -> p.getMethod() == PaymentMethod.CASH)
                    .map(StoreSalePayment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }
        if (paymentMethod == null || paymentMethod == PaymentMethod.CASH) {
            return total != null ? total : BigDecimal.ZERO;
        }
        return BigDecimal.ZERO;
    }

    public boolean affectsCashDrawer() {
        if (type == StoreSaleType.MANUAL_INCOME || type == StoreSaleType.MANUAL_EXPENSE) {
            return true;
        }
        return cashDrawerAmount().compareTo(BigDecimal.ZERO) > 0;
    }
}
