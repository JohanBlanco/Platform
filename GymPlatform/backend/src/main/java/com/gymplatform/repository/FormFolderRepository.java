package com.gymplatform.repository;

import com.gymplatform.domain.entity.FormFolder;
import com.gymplatform.domain.enums.FormFolderKind;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface FormFolderRepository extends JpaRepository<FormFolder, Long> {

    List<FormFolder> findByOrganizationIdAndKindOrderByNameAsc(Long organizationId, FormFolderKind kind);

    Optional<FormFolder> findByIdAndOrganizationId(Long id, Long organizationId);

    Optional<FormFolder> findByOrganizationIdAndSlugAndKind(Long organizationId, String slug, FormFolderKind kind);

    boolean existsByOrganizationIdAndSlugAndKind(Long organizationId, String slug, FormFolderKind kind);

    @Query("SELECT COUNT(s) FROM CustomFormSubmission s WHERE s.responseFolder.id = :folderId")
    long countSubmissions(@Param("folderId") Long folderId);

    @Query("SELECT COUNT(DISTINCT s.form.id) FROM CustomFormSubmission s WHERE s.responseFolder.id = :folderId")
    long countDistinctForms(@Param("folderId") Long folderId);

    @Query("SELECT COUNT(f) FROM CustomForm f WHERE f.templateFolder.id = :folderId")
    long countTemplateForms(@Param("folderId") Long folderId);
}
