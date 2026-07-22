package com.gymplatform.repository;

import com.gymplatform.domain.entity.Routine;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RoutineRepository extends JpaRepository<Routine, Long> {
    List<Routine> findByMemberIdAndActiveTrue(Long memberId);
    List<Routine> findByOrganizationIdAndActiveTrue(Long organizationId);
}
