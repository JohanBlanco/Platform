package com.gymplatform.repository;

import com.gymplatform.domain.entity.AppointmentRequest;
import com.gymplatform.domain.enums.AppointmentRequestStatus;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AppointmentRequestRepository extends JpaRepository<AppointmentRequest, Long> {
    List<AppointmentRequest> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId);

    List<AppointmentRequest> findByMemberIdOrderByCreatedAtDesc(Long memberId);

    long countByOrganizationIdAndStatus(Long organizationId, AppointmentRequestStatus status);

    @Modifying
    @Query("""
            DELETE FROM AppointmentRequest a
            WHERE a.scheduledEnd IS NOT NULL
              AND a.scheduledEnd < :cutoff
            """)
    int deletePassedBefore(@Param("cutoff") Instant cutoff);

    @Query("""
            SELECT a FROM AppointmentRequest a
            WHERE a.organization.id = :orgId
              AND a.scheduledStart IS NOT NULL
              AND a.scheduledStart >= :from
              AND a.scheduledStart < :to
            ORDER BY a.scheduledStart ASC
            """)
    List<AppointmentRequest> findScheduledInRange(
            @Param("orgId") Long organizationId,
            @Param("from") Instant from,
            @Param("to") Instant to);

    @Query("""
            SELECT a FROM AppointmentRequest a
            WHERE a.organization.id = :orgId
              AND a.scheduledStart IS NOT NULL
              AND a.scheduledStart >= :from
              AND a.scheduledStart < :to
              AND a.preferredStaff.id = :staffId
            ORDER BY a.scheduledStart ASC
            """)
    List<AppointmentRequest> findScheduledInRangeForPreferredStaff(
            @Param("orgId") Long organizationId,
            @Param("staffId") Long staffId,
            @Param("from") Instant from,
            @Param("to") Instant to);

    @Query("""
            SELECT a FROM AppointmentRequest a
            WHERE a.organization.id = :orgId
              AND a.scheduledStart IS NOT NULL
              AND a.scheduledStart < :end
              AND a.scheduledEnd > :start
              AND a.status IN :statuses
              AND (:excludeId IS NULL OR a.id <> :excludeId)
            """)
    List<AppointmentRequest> findOverlappingForOrganization(
            @Param("orgId") Long organizationId,
            @Param("start") Instant start,
            @Param("end") Instant end,
            @Param("statuses") List<AppointmentRequestStatus> statuses,
            @Param("excludeId") Long excludeAppointmentId);

    List<AppointmentRequest> findByStaffAvailabilityIdAndStatus(
            Long staffAvailabilityId, AppointmentRequestStatus status);

    List<AppointmentRequest> findByStaffAvailabilityId(Long staffAvailabilityId);

    @Query("""
            SELECT a FROM AppointmentRequest a
            WHERE a.staffAvailability.id = :availabilityId
              AND a.status IN (
                com.gymplatform.domain.enums.AppointmentRequestStatus.OPEN,
                com.gymplatform.domain.enums.AppointmentRequestStatus.BLOCKED
              )
              AND a.scheduledStart < :end
              AND a.scheduledEnd > :start
            """)
    List<AppointmentRequest> findPlaceholderOverlappingAvailability(
            @Param("availabilityId") Long availabilityId,
            @Param("start") Instant start,
            @Param("end") Instant end);

    @Query("""
            SELECT a FROM AppointmentRequest a
            WHERE a.organization.id = :orgId
              AND a.status = com.gymplatform.domain.enums.AppointmentRequestStatus.OPEN
              AND a.scheduledStart IS NOT NULL
              AND a.scheduledStart >= :from
              AND a.scheduledStart < :to
            ORDER BY a.scheduledStart ASC
            """)
    List<AppointmentRequest> findOpenInRange(
            @Param("orgId") Long organizationId,
            @Param("from") Instant from,
            @Param("to") Instant to);

    @Query("""
            SELECT a FROM AppointmentRequest a
            WHERE a.organization.id = :orgId
              AND a.status = com.gymplatform.domain.enums.AppointmentRequestStatus.BLOCKED
              AND a.scheduledStart IS NOT NULL
              AND a.scheduledStart >= :from
              AND a.scheduledStart < :to
            ORDER BY a.scheduledStart ASC
            """)
    List<AppointmentRequest> findBlockedInRange(
            @Param("orgId") Long organizationId,
            @Param("from") Instant from,
            @Param("to") Instant to);

    @Query("""
            SELECT a FROM AppointmentRequest a
            WHERE a.organization.id = :orgId
              AND a.status = com.gymplatform.domain.enums.AppointmentRequestStatus.OPEN
              AND a.scheduledStart = :start
              AND a.scheduledEnd = :end
            """)
    List<AppointmentRequest> findOpenAtExactTime(
            @Param("orgId") Long organizationId,
            @Param("start") Instant start,
            @Param("end") Instant end);

    @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT a FROM AppointmentRequest a
            WHERE a.organization.id = :orgId
              AND a.status = com.gymplatform.domain.enums.AppointmentRequestStatus.OPEN
              AND a.scheduledStart = :start
              AND a.scheduledEnd = :end
            """)
    List<AppointmentRequest> findOpenAtExactTimeForUpdate(
            @Param("orgId") Long organizationId,
            @Param("start") Instant start,
            @Param("end") Instant end);

    @Query("""
            SELECT a FROM AppointmentRequest a
            WHERE a.organization.id = :orgId
              AND a.status = com.gymplatform.domain.enums.AppointmentRequestStatus.BLOCKED
              AND a.scheduledStart = :start
              AND a.scheduledEnd = :end
            """)
    List<AppointmentRequest> findBlockedAtExactTime(
            @Param("orgId") Long organizationId,
            @Param("start") Instant start,
            @Param("end") Instant end);

    @Query("""
            SELECT a FROM AppointmentRequest a
            WHERE a.id = :id
              AND a.organization.id = :orgId
              AND a.status = com.gymplatform.domain.enums.AppointmentRequestStatus.OPEN
            """)
    java.util.Optional<AppointmentRequest> findOpenByIdAndOrganizationId(
            @Param("id") Long id,
            @Param("orgId") Long organizationId);

    /**
     * Misma consulta con bloqueo pesimista: solo un cliente gana el cupo OPEN concurrente.
     */
    @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT a FROM AppointmentRequest a
            WHERE a.id = :id
              AND a.organization.id = :orgId
              AND a.status = com.gymplatform.domain.enums.AppointmentRequestStatus.OPEN
            """)
    java.util.Optional<AppointmentRequest> findOpenByIdAndOrganizationIdForUpdate(
            @Param("id") Long id,
            @Param("orgId") Long organizationId);

    @Query("""
            SELECT a FROM AppointmentRequest a
            WHERE a.organization.id = :orgId
              AND a.status = com.gymplatform.domain.enums.AppointmentRequestStatus.OPEN
              AND a.scheduledStart >= :dayStart
              AND a.scheduledStart < :dayEnd
            ORDER BY a.scheduledStart ASC
            """)
    List<AppointmentRequest> findOpenForDate(
            @Param("orgId") Long organizationId,
            @Param("dayStart") Instant dayStart,
            @Param("dayEnd") Instant dayEnd);
}
