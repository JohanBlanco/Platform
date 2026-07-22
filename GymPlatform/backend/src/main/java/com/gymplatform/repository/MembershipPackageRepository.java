package com.gymplatform.repository;

import com.gymplatform.domain.entity.MembershipPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MembershipPackageRepository extends JpaRepository<MembershipPackage, Long> {
    List<MembershipPackage> findByOrganizationIdAndActiveTrue(Long organizationId);

    Optional<MembershipPackage> findByIdAndOrganizationId(Long id, Long organizationId);

    Optional<MembershipPackage> findByOrganizationIdAndNameIgnoreCase(Long organizationId, String name);
}
