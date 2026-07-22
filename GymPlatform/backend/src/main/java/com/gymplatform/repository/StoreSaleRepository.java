package com.gymplatform.repository;

import com.gymplatform.domain.entity.StoreSale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface StoreSaleRepository extends JpaRepository<StoreSale, Long> {
    @Query("""
            select s from StoreSale s
            where s.organization.id = :orgId
              and s.createdAt >= :from
              and s.createdAt < :to
            order by s.createdAt desc
            """)
    List<StoreSale> findByOrganizationAndPeriod(
            @Param("orgId") Long organizationId,
            @Param("from") Instant from,
            @Param("to") Instant to);

    List<StoreSale> findByCashSessionIdOrderByCreatedAtAsc(Long cashSessionId);

    @Query("""
            select distinct s from StoreSale s
            left join fetch s.payments
            where s.cashSession.id = :sessionId
            order by s.createdAt asc
            """)
    List<StoreSale> findByCashSessionIdWithPayments(@Param("sessionId") Long sessionId);
}
