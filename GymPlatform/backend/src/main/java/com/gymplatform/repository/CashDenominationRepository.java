package com.gymplatform.repository;

import com.gymplatform.domain.entity.CashDenomination;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CashDenominationRepository extends JpaRepository<CashDenomination, Long> {
    List<CashDenomination> findByOrganizationIdOrderBySortOrderAscValueColonesAsc(Long organizationId);

    List<CashDenomination> findByOrganizationIdAndActiveTrueOrderBySortOrderAscValueColonesAsc(Long organizationId);

    boolean existsByOrganizationId(Long organizationId);

    boolean existsByOrganizationIdAndValueColones(Long organizationId, int valueColones);
}
