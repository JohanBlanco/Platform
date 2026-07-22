package com.gymplatform.repository;

import com.gymplatform.domain.entity.RoutineRequest;
import com.gymplatform.domain.enums.RoutineRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.List;

public interface RoutineRequestRepository extends JpaRepository<RoutineRequest, Long> {
    List<RoutineRequest> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId);
    List<RoutineRequest> findByMemberIdOrderByCreatedAtDesc(Long memberId);
    List<RoutineRequest> findByOrganizationIdAndStatus(Long organizationId, RoutineRequestStatus status);
    List<RoutineRequest> findByOrganizationIdAndPreferredInstructorIdOrderByCreatedAtDesc(
            Long organizationId, Long preferredInstructorId);

    List<RoutineRequest> findByOrganizationIdAndAssignedInstructorIdOrderByCreatedAtDesc(
            Long organizationId, Long assignedInstructorId);

    boolean existsByMemberIdAndStatusIn(Long memberId, List<RoutineRequestStatus> statuses);

    @Modifying
    @Query("""
            DELETE FROM RoutineRequest r
            WHERE r.status = com.gymplatform.domain.enums.RoutineRequestStatus.COMPLETED
              AND (
                (r.completedAt IS NOT NULL AND r.completedAt < :cutoff)
                OR (r.completedAt IS NULL AND r.updatedAt < :cutoff)
              )
            """)
    int deleteStaleCompleted(@Param("cutoff") Instant cutoff);
}
