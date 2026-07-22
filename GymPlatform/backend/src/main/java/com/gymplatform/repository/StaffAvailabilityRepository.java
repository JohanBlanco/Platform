package com.gymplatform.repository;

import com.gymplatform.domain.entity.StaffAvailability;
import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StaffAvailabilityRepository extends JpaRepository<StaffAvailability, Long> {
    List<StaffAvailability> findByOrganizationIdAndStaffIsNullAndAvailabilityDateOrderByStartTimeAsc(
            Long organizationId, LocalDate availabilityDate);

    List<StaffAvailability> findByOrganizationIdAndStaffIsNullAndAvailabilityDateBetweenOrderByAvailabilityDateAscStartTimeAsc(
            Long organizationId, LocalDate from, LocalDate to);

    boolean existsByOrganizationIdAndStaffIsNullAndAvailabilityDateAndStartTimeAndEndTime(
            Long organizationId, LocalDate availabilityDate, LocalTime startTime, LocalTime endTime);

    @Query("""
            SELECT s FROM StaffAvailability s
            WHERE s.organization.id = :orgId
              AND s.staff IS NULL
              AND s.startTime = :startTime
              AND s.endTime = :endTime
              AND ((:slotMinutes IS NULL AND s.slotDurationMinutes IS NULL)
                   OR s.slotDurationMinutes = :slotMinutes)
            ORDER BY s.availabilityDate ASC
            """)
    List<StaffAvailability> findMatchingBlocks(
            @Param("orgId") Long organizationId,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("slotMinutes") Integer slotDurationMinutes);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM StaffAvailability s WHERE s.id = :id")
    Optional<StaffAvailability> findByIdForUpdate(@Param("id") Long id);

    /**
     * Bloquea la disponibilidad del día: serializa reservas concurrentes sobre los
     * mismos espacios (n abiertos + n+1 peticiones ⇒ solo n éxitos).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT s FROM StaffAvailability s
            WHERE s.organization.id = :orgId
              AND s.staff IS NULL
              AND s.availabilityDate = :date
            ORDER BY s.startTime ASC
            """)
    List<StaffAvailability> findDayBlocksForUpdate(
            @Param("orgId") Long organizationId,
            @Param("date") LocalDate date);
}
