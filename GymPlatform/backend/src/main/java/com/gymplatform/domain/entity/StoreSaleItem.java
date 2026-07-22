package com.gymplatform.domain.entity;

import com.gymplatform.domain.enums.StoreSaleItemKind;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "store_sale_items")
public class StoreSaleItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "store_sale_id")
    private StoreSale storeSale;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private StoreSaleItemKind kind;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "membership_package_id")
    private MembershipPackage membershipPackage;

    @Column(nullable = false, length = 200)
    private String description;

    @Column(nullable = false)
    private int quantity = 1;

    /** Unidades de inventario descontadas (solo productos). */
    @Column(nullable = false)
    private int stockUnitsDeducted = 0;

    /** Suscripción creada al vender membresía (para poder anularla). */
    @Column(name = "member_subscription_id")
    private Long memberSubscriptionId;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal lineTotal = BigDecimal.ZERO;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public StoreSale getStoreSale() { return storeSale; }
    public void setStoreSale(StoreSale storeSale) { this.storeSale = storeSale; }
    public StoreSaleItemKind getKind() { return kind; }
    public void setKind(StoreSaleItemKind kind) { this.kind = kind; }
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    public MembershipPackage getMembershipPackage() { return membershipPackage; }
    public void setMembershipPackage(MembershipPackage membershipPackage) { this.membershipPackage = membershipPackage; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public int getStockUnitsDeducted() { return stockUnitsDeducted; }
    public void setStockUnitsDeducted(int stockUnitsDeducted) { this.stockUnitsDeducted = stockUnitsDeducted; }
    public Long getMemberSubscriptionId() { return memberSubscriptionId; }
    public void setMemberSubscriptionId(Long memberSubscriptionId) { this.memberSubscriptionId = memberSubscriptionId; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    public BigDecimal getLineTotal() { return lineTotal; }
    public void setLineTotal(BigDecimal lineTotal) { this.lineTotal = lineTotal; }
}
