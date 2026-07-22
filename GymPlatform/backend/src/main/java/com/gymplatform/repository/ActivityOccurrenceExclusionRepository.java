package com.gymplatform.repository;

import com.gymplatform.domain.entity.ActivityOccurrenceExclusion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ActivityOccurrenceExclusionRepository extends JpaRepository<ActivityOccurrenceExclusion, Long> {

    Optional<ActivityOccurrenceExclusion> findByActivityIdAndOccurrenceDate(
            Long activityId, LocalDate occurrenceDate);

    boolean existsByActivityIdAndOccurrenceDate(Long activityId, LocalDate occurrenceDate);

    @Query("""
            SELECT e FROM ActivityOccurrenceExclusion e
            WHERE e.activity.id IN :activityIds
            AND e.occurrenceDate BETWEEN :from AND :to
            """)
    List<ActivityOccurrenceExclusion> findByActivityIdsAndOccurrenceDateBetween(
            @Param("activityIds") List<Long> activityIds,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    @Modifying
    @Query("DELETE FROM ActivityOccurrenceExclusion e WHERE e.activity.id = :activityId")
    void deleteByActivityId(@Param("activityId") Long activityId);
}
