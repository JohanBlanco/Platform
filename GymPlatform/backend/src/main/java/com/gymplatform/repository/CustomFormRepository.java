package com.gymplatform.repository;

import com.gymplatform.domain.entity.CustomForm;
import com.gymplatform.domain.enums.FormPurpose;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface CustomFormRepository extends JpaRepository<CustomForm, Long> {

    List<CustomForm> findByOrganizationIdOrderByTitleAsc(Long organizationId);

    List<CustomForm> findByOrganizationIdAndTemplateFolderIdOrderByTitleAsc(Long organizationId, Long templateFolderId);

    @Query("""
            SELECT f FROM CustomForm f
            WHERE f.organization.id = :organizationId
              AND f.templateFolder IS NULL
            ORDER BY f.title ASC
            """)
    List<CustomForm> findWithoutTemplateFolder(@Param("organizationId") Long organizationId);

    Optional<CustomForm> findByIdAndOrganizationId(Long id, Long organizationId);

    Optional<CustomForm> findByOrganizationIdAndSlug(Long organizationId, String slug);

    Optional<CustomForm> findByOrganization_SlugAndSlug(String organizationSlug, String slug);

    boolean existsByOrganizationIdAndSlug(Long organizationId, String slug);

    Optional<CustomForm> findByOrganizationIdAndFormPurpose(Long organizationId, FormPurpose formPurpose);
}
