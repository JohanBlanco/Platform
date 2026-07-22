package com.gymplatform.repository;



import com.gymplatform.domain.entity.Reservation;

import com.gymplatform.domain.enums.ReservationStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import org.springframework.data.repository.query.Param;

import java.time.Instant;

import java.time.LocalDate;

import java.util.List;



public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByMemberId(Long memberId);

    List<Reservation> findByActivityId(Long activityId);

    long countByActivityIdAndStatus(Long activityId, ReservationStatus status);

    long countByActivityIdAndOccurrenceDateAndStatus(Long activityId, LocalDate occurrenceDate, ReservationStatus status);

    @Query("""
            SELECT r.activity.id, COUNT(r.id)
            FROM Reservation r
            WHERE r.activity IS NOT NULL
              AND r.activity.organization.id = :orgId
              AND r.status = com.gymplatform.domain.enums.ReservationStatus.CONFIRMED
            GROUP BY r.activity.id
            """)
    List<Object[]> countConfirmedGroupedByActivity(@Param("orgId") Long organizationId);

    long countByMemberIdAndFreeSlotTrueAndStatusAndCreatedAtGreaterThanEqual(

            Long memberId, ReservationStatus status, Instant since);

    boolean existsByActivityIdAndMemberIdAndStatusIn(Long activityId, Long memberId, List<ReservationStatus> statuses);

    boolean existsByActivityIdAndMemberIdAndOccurrenceDateAndStatusIn(

            Long activityId, Long memberId, LocalDate occurrenceDate, List<ReservationStatus> statuses);

    List<Reservation> findByActivityIdAndStatusIn(Long activityId, List<ReservationStatus> statuses);

    @Query("""
            SELECT r FROM Reservation r
            JOIN FETCH r.member m
            WHERE r.activity.id = :activityId
            AND r.status IN :statuses
            ORDER BY r.occurrenceDate ASC
            """)
    List<Reservation> findByActivityIdAndStatusInWithMember(
            @Param("activityId") Long activityId,
            @Param("statuses") List<ReservationStatus> statuses);

    @Query("""

            SELECT r FROM Reservation r

            JOIN FETCH r.activity a

            JOIN FETCH r.member m

            WHERE a.organization.id = :orgId

            AND r.paymentRequired = true

            AND r.paid = false

            AND r.status = com.gymplatform.domain.enums.ReservationStatus.CONFIRMED

            AND r.activity IS NOT NULL

            ORDER BY r.createdAt ASC

            """)

    List<Reservation> findPendingPaymentsByOrganization(@Param("orgId") Long orgId);



    @Query("""

            SELECT r FROM Reservation r

            JOIN FETCH r.activity a

            JOIN FETCH r.member m

            WHERE a.organization.id = :orgId

            AND r.paymentRequired = true

            AND r.paid = true

            ORDER BY r.updatedAt DESC

            """)

    List<Reservation> findPaidSalesByOrganization(@Param("orgId") Long orgId);



    @Query("""

            SELECT r FROM Reservation r

            JOIN FETCH r.activity a

            JOIN FETCH r.member m

            WHERE a.organization.id = :orgId

            """)

    List<Reservation> findByOrganizationId(@Param("orgId") Long orgId);

    @Modifying
    @Query("DELETE FROM Reservation r WHERE r.activity.id = :activityId")
    void deleteByActivityId(@Param("activityId") Long activityId);

}

