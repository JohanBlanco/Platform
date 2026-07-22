package com.gymplatform.repository;

import com.gymplatform.domain.entity.MemberProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface MemberProfileRepository extends JpaRepository<MemberProfile, Long> {
    Optional<MemberProfile> findByUserId(Long userId);

    @Query(value = """
            SELECT p.* FROM member_profiles p
            WHERE REGEXP_REPLACE(COALESCE(p.national_id, ''), '[^0-9]', '') = :nationalId
            """, nativeQuery = true)
    List<MemberProfile> findAllByNationalId(@Param("nationalId") String nationalId);

    @Query("""
            SELECT COUNT(p) > 0 FROM MemberProfile p
            WHERE p.nationalId = :nationalId
              AND p.user.organization.id = :organizationId
              AND (:excludeUserId IS NULL OR p.user.id <> :excludeUserId)
            """)
    boolean existsNationalIdInOrganization(
            @Param("nationalId") String nationalId,
            @Param("organizationId") Long organizationId,
            @Param("excludeUserId") Long excludeUserId);

    @Query("""
            SELECT p FROM MemberProfile p
            WHERE p.nationalId = :nationalId
              AND p.user.organization.id = :organizationId
            """)
    Optional<MemberProfile> findByNationalIdInOrganization(
            @Param("nationalId") String nationalId,
            @Param("organizationId") Long organizationId);
}
