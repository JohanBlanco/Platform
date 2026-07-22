package com.gymplatform.repository;

import com.gymplatform.domain.entity.User;
import com.gymplatform.domain.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmail(String email);
    List<User> findByOrganizationId(Long organizationId);

    @Query(value = """
            SELECT u.* FROM users u
            WHERE REGEXP_REPLACE(COALESCE(u.national_id, ''), '[^0-9]', '') = :nationalId
            """, nativeQuery = true)
    List<User> findAllByNationalId(@Param("nationalId") String nationalId);

    @Query(value = """
            SELECT COUNT(*) > 0 FROM users u
            WHERE REGEXP_REPLACE(COALESCE(u.national_id, ''), '[^0-9]', '') = :nationalId
              AND (:excludeUserId IS NULL OR u.id <> :excludeUserId)
            """, nativeQuery = true)
    boolean existsByNationalIdExcluding(
            @Param("nationalId") String nationalId,
            @Param("excludeUserId") Long excludeUserId);

    @Query("SELECT DISTINCT u FROM User u JOIN u.roles r WHERE u.organization.id = :organizationId AND r = :role")
    List<User> findByOrganizationIdAndRole(@Param("organizationId") Long organizationId, @Param("role") Role role);

    @Query("SELECT u FROM User u WHERE u.whatsappPhone = :phone AND u.organization.id = :organizationId")
    Optional<User> findByWhatsappPhoneAndOrganizationId(
            @Param("phone") String phone,
            @Param("organizationId") Long organizationId);
}
