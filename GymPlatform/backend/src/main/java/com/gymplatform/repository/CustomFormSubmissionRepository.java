package com.gymplatform.repository;

import com.gymplatform.domain.entity.CustomFormSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface CustomFormSubmissionRepository extends JpaRepository<CustomFormSubmission, Long> {

    List<CustomFormSubmission> findByResponseFolderIdOrderByCreatedAtDesc(Long responseFolderId);

    List<CustomFormSubmission> findBySubmittedBy_Organization_IdAndSubmittedByIsNotNullOrderByCreatedAtDesc(
            Long organizationId);

    List<CustomFormSubmission> findBySubmittedBy_IdAndSubmittedBy_Organization_IdOrderByCreatedAtDesc(
            Long userId, Long organizationId);

    java.util.Optional<CustomFormSubmission> findByIdAndSubmittedBy_IdAndSubmittedBy_Organization_Id(
            Long id, Long userId, Long organizationId);

    @Query("""
            SELECT DISTINCT s.form.id FROM CustomFormSubmission s
            WHERE s.responseFolder.id = :folderId
            """)
    List<Long> findDistinctFormIdsByResponseFolderId(@Param("folderId") Long folderId);

    long countByResponseFolderId(Long responseFolderId);
}
