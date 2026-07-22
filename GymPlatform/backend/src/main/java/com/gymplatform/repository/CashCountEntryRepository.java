package com.gymplatform.repository;

import com.gymplatform.domain.entity.CashCountEntry;
import com.gymplatform.domain.enums.CashCountPhase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CashCountEntryRepository extends JpaRepository<CashCountEntry, Long> {
    List<CashCountEntry> findByCashSessionIdAndPhaseOrderByValueColonesAsc(Long cashSessionId, CashCountPhase phase);
}
