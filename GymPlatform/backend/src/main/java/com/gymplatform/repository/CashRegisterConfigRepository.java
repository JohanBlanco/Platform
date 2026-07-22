package com.gymplatform.repository;

import com.gymplatform.domain.entity.CashRegisterConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CashRegisterConfigRepository extends JpaRepository<CashRegisterConfig, Long> {
    Optional<CashRegisterConfig> findByOrganizationId(Long organizationId);

    boolean existsByOrganizationId(Long organizationId);
}
