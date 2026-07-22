package com.gymplatform.repository;

import com.gymplatform.domain.entity.BodyMeasurement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BodyMeasurementRepository extends JpaRepository<BodyMeasurement, Long> {

    List<BodyMeasurement> findByOrganizationIdAndMemberIdOrderByMeasuredAtDesc(Long organizationId, Long memberId);

    Optional<BodyMeasurement> findTopByOrganizationIdAndMemberIdOrderByMeasuredAtDesc(Long organizationId, Long memberId);

    Optional<BodyMeasurement> findByIdAndOrganizationId(Long id, Long organizationId);
}
