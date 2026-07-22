package com.gymplatform.repository;

import com.gymplatform.domain.entity.OrganizationStatisticsAccess;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OrganizationStatisticsAccessRepository extends JpaRepository<OrganizationStatisticsAccess, Long> {
    Optional<OrganizationStatisticsAccess> findByOrganizationId(Long organizationId);
}
