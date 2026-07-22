package com.gymplatform.repository;

import com.gymplatform.domain.entity.RoutineTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RoutineTemplateRepository extends JpaRepository<RoutineTemplate, Long> {
    List<RoutineTemplate> findByOrganizationIdAndActiveTrue(Long organizationId);
    List<RoutineTemplate> findByInstructorIdAndActiveTrue(Long instructorId);
}
