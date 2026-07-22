package com.gymplatform.repository;

import com.gymplatform.domain.entity.ForumTopic;
import com.gymplatform.domain.enums.MuscleGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ForumTopicRepository extends JpaRepository<ForumTopic, Long> {
    List<ForumTopic> findByForumIdAndActiveTrueOrderByTitleAsc(Long forumId);

    List<ForumTopic> findByForumIdAndActiveTrueAndMuscleGroupOrderByTitleAsc(Long forumId, MuscleGroup muscleGroup);

    Optional<ForumTopic> findByForumIdAndExerciseIdAndActiveTrue(Long forumId, Long exerciseId);

    Optional<ForumTopic> findByIdAndActiveTrue(Long id);

    Optional<ForumTopic> findFirstByForumIdAndTitleIgnoreCase(Long forumId, String title);
}
