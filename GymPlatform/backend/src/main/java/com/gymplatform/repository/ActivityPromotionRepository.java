package com.gymplatform.repository;

import com.gymplatform.domain.entity.ActivityPromotion;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ActivityPromotionRepository extends JpaRepository<ActivityPromotion, Long> {

    List<ActivityPromotion> findByOrganizationIdOrderBySlotIndexAsc(Long organizationId);

    Optional<ActivityPromotion> findByOrganizationIdAndSlotIndex(Long organizationId, int slotIndex);

    boolean existsByOrganizationIdAndActivityIdAndSlotIndexNot(
            Long organizationId, Long activityId, int slotIndex);

    @Modifying
    @Query("DELETE FROM ActivityPromotion p WHERE p.activity.id = :activityId")
    void deleteByActivityId(@Param("activityId") Long activityId);
}
