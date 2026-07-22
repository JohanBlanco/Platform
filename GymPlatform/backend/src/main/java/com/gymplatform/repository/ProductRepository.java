package com.gymplatform.repository;

import com.gymplatform.domain.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByOrganizationIdAndActiveTrueOrderByNameAsc(Long organizationId);

    @Query("""
            select distinct p from Product p
            join p.categories c
            where p.organization.id = :orgId
              and p.active = true
              and c.id in :categoryIds
            order by p.name asc
            """)
    List<Product> findActiveByOrganizationAndCategoryIds(
            @Param("orgId") Long organizationId,
            @Param("categoryIds") Collection<Long> categoryIds);

    Optional<Product> findByIdAndOrganizationIdAndActiveTrue(Long id, Long organizationId);

    boolean existsByOrganizationIdAndNameNormalizedAndActiveTrue(Long organizationId, String nameNormalized);

    boolean existsByOrganizationIdAndNameNormalizedAndActiveTrueAndIdNot(Long organizationId, String nameNormalized, Long id);

    boolean existsByOrganizationIdAndCodePrefixIgnoreCaseAndActiveTrue(Long organizationId, String codePrefix);

    boolean existsByOrganizationIdAndCodePrefixIgnoreCaseAndActiveTrueAndIdNot(Long organizationId, String codePrefix, Long id);

    @Query("""
            select distinct p from Product p
            left join fetch p.categories
            where p.id in :ids
            """)
    List<Product> findByIdsWithCategories(@Param("ids") Collection<Long> ids);

    long countByOrganizationIdAndActiveTrue(Long organizationId);
}
