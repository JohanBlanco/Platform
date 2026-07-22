package com.gymplatform.repository;

import com.gymplatform.domain.entity.NutritionPlan;
import com.gymplatform.domain.enums.NutritionPlanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface NutritionPlanRepository extends JpaRepository<NutritionPlan, Long> {

    List<NutritionPlan> findByOrganizationIdAndMemberIdOrderByCreatedAtDesc(Long organizationId, Long memberId);

    List<NutritionPlan> findByOrganizationIdAndStatusOrderByUpdatedAtDesc(Long organizationId, NutritionPlanStatus status);

    Optional<NutritionPlan> findByIdAndOrganizationId(Long id, Long organizationId);

    Optional<NutritionPlan> findFirstByOrganizationIdAndMemberIdAndStatusOrderByUpdatedAtDesc(
            Long organizationId, Long memberId, NutritionPlanStatus status);
}
