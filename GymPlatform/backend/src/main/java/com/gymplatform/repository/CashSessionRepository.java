package com.gymplatform.repository;

import com.gymplatform.domain.entity.CashSession;
import com.gymplatform.domain.enums.CashSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface CashSessionRepository extends JpaRepository<CashSession, Long> {
    Optional<CashSession> findFirstByOrganizationIdAndStatusOrderByOpenedAtDesc(
            Long organizationId, CashSessionStatus status);

    Optional<CashSession> findByIdAndOrganizationId(Long id, Long organizationId);

    List<CashSession> findByOrganizationIdAndOpenedAtGreaterThanEqualAndOpenedAtLessThanOrderByOpenedAtAsc(
            Long organizationId, Instant from, Instant to);

    @Query("""
            SELECT DISTINCT s FROM StoreSale sale
            JOIN sale.cashSession s
            WHERE s.organization.id = :orgId
              AND sale.createdAt >= :from AND sale.createdAt < :to
            """)
    List<CashSession> findWithSalesInPeriod(
            @Param("orgId") Long organizationId,
            @Param("from") Instant from,
            @Param("to") Instant to);
}
