package com.gymplatform.repository;

import com.gymplatform.domain.entity.Forum;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ForumRepository extends JpaRepository<Forum, Long> {
    Optional<Forum> findBySlugAndActiveTrue(String slug);
    List<Forum> findByActiveTrueOrderByTitleAsc();
}
