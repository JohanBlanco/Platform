package com.gymplatform.repository;

import com.gymplatform.domain.entity.ActivityOccurrenceCancellation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ActivityOccurrenceCancellationRepository extends JpaRepository<ActivityOccurrenceCancellation, Long> {

    Optional<ActivityOccurrenceCancellation> findByActivityIdAndOccurrenceDate(
            Long activityId, LocalDate occurrenceDate);

    boolean existsByActivityIdAndOccurrenceDate(Long activityId, LocalDate occurrenceDate);

    @Query("""
            SELECT c FROM ActivityOccurrenceCancellation c
            WHERE c.activity.id IN :activityIds
            AND c.occurrenceDate BETWEEN :from AND :to
            """)
    List<ActivityOccurrenceCancellation> findByActivityIdsAndOccurrenceDateBetween(
            @Param("activityIds") List<Long> activityIds,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    @Modifying
    @Query("DELETE FROM ActivityOccurrenceCancellation c WHERE c.activity.id = :activityId")
    void deleteByActivityId(@Param("activityId") Long activityId);
}
