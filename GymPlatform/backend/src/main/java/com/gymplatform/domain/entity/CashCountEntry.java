package com.gymplatform.domain.entity;

import com.gymplatform.domain.enums.CashCountPhase;
import jakarta.persistence.*;

@Entity
@Table(name = "cash_count_entries")
public class CashCountEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "cash_session_id")
    private CashSession cashSession;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private CashCountPhase phase;

    @Column(name = "value_colones", nullable = false)
    private int valueColones;

    @Column(nullable = false)
    private int quantity;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public CashSession getCashSession() { return cashSession; }
    public void setCashSession(CashSession cashSession) { this.cashSession = cashSession; }
    public CashCountPhase getPhase() { return phase; }
    public void setPhase(CashCountPhase phase) { this.phase = phase; }
    public int getValueColones() { return valueColones; }
    public void setValueColones(int valueColones) { this.valueColones = valueColones; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
}
