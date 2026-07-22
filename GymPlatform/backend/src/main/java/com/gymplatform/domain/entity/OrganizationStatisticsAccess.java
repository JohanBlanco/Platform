package com.gymplatform.domain.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
        name = "organization_statistics_access",
        uniqueConstraints = @UniqueConstraint(columnNames = {"organization_id"})
)
public class OrganizationStatisticsAccess {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false, unique = true)
    private Organization organization;

    @Column(name = "password_hash", length = 100)
    private String passwordHash;

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Organization getOrganization() { return organization; }
    public void setOrganization(Organization organization) { this.organization = organization; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public boolean isConfigured() {
        return passwordHash != null && !passwordHash.isBlank();
    }
}
