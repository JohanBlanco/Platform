package com.gymplatform.repository;

import com.gymplatform.domain.entity.ActivityOccurrenceOverride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ActivityOccurrenceOverrideRepository extends JpaRepository<ActivityOccurrenceOverride, Long> {
    Optional<ActivityOccurrenceOverride> findByActivityIdAndOccurrenceDate(Long activityId, LocalDate occurrenceDate);

    @Query("""
            SELECT o FROM ActivityOccurrenceOverride o
            WHERE o.activity.id IN :activityIds
            AND o.occurrenceDate BETWEEN :from AND :to
            """)
    List<ActivityOccurrenceOverride> findByActivityIdsAndOccurrenceDateBetween(
            @Param("activityIds") List<Long> activityIds,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    @Modifying
    @Query("DELETE FROM ActivityOccurrenceOverride o WHERE o.activity.id = :activityId")
    void deleteByActivityId(@Param("activityId") Long activityId);
}
