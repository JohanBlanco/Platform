package com.gymplatform.repository;

import com.gymplatform.domain.entity.MemberSubscription;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MemberSubscriptionRepository extends JpaRepository<MemberSubscription, Long> {
    Optional<MemberSubscription> findFirstByMemberIdAndActiveTrueOrderByStartDateDesc(Long memberId);

    Optional<MemberSubscription> findFirstByMemberIdOrderByStartDateDesc(Long memberId);

    List<MemberSubscription> findByMemberIdAndActiveTrueOrderByStartDateAsc(Long memberId);

    /** Serializa consumo de cupos gratuitos de la misma membresía. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM MemberSubscription s WHERE s.id = :id")
    Optional<MemberSubscription> findByIdForUpdate(@Param("id") Long id);
}
