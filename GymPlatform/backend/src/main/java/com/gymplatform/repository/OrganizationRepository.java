package com.gymplatform.repository;

import com.gymplatform.domain.entity.Organization;
import com.gymplatform.domain.enums.SubscriptionStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrganizationRepository extends JpaRepository<Organization, Long> {
    Optional<Organization> findBySlug(String slug);
    List<Organization> findBySubscriptionStatus(SubscriptionStatus status);
    List<Organization> findByActiveTrue();

    /** Serializa altas de citas personalizadas del mismo gimnasio cuando no hay bloque del día. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Organization o WHERE o.id = :id")
    Optional<Organization> findByIdForUpdate(@Param("id") Long id);
}
