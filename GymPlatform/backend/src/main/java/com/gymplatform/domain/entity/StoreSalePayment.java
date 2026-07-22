package com.gymplatform.domain.entity;

import com.gymplatform.domain.enums.PaymentMethod;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "store_sale_payments")
public class StoreSalePayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "store_sale_id")
    private StoreSale storeSale;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 16)
    private PaymentMethod method;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount = BigDecimal.ZERO;

    /** Comprobante SINPE (data URL), opcional. */
    @Column(name = "payment_proof_data", columnDefinition = "TEXT")
    private String paymentProofData;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public StoreSale getStoreSale() { return storeSale; }
    public void setStoreSale(StoreSale storeSale) { this.storeSale = storeSale; }
    public PaymentMethod getMethod() { return method; }
    public void setMethod(PaymentMethod method) { this.method = method; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getPaymentProofData() { return paymentProofData; }
    public void setPaymentProofData(String paymentProofData) { this.paymentProofData = paymentProofData; }
}
