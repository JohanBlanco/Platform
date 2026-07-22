package com.gymplatform.repository;

import com.gymplatform.domain.entity.ProductCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductCategoryRepository extends JpaRepository<ProductCategory, Long> {
    List<ProductCategory> findByOrganizationIdAndActiveTrueOrderBySortOrderAscNameAsc(Long organizationId);

    Optional<ProductCategory> findByIdAndOrganizationIdAndActiveTrue(Long id, Long organizationId);

    boolean existsByOrganizationIdAndSlug(Long organizationId, String slug);

    Optional<ProductCategory> findByOrganizationIdAndSlugIgnoreCase(Long organizationId, String slug);

    Optional<ProductCategory> findFirstByOrganizationIdAndNameIgnoreCaseAndActiveTrue(Long organizationId, String name);
}
