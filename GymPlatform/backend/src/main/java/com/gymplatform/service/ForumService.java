package com.gymplatform.service;

import com.gymplatform.domain.entity.Forum;
import com.gymplatform.domain.entity.ForumTopic;
import com.gymplatform.domain.enums.MuscleGroup;
import com.gymplatform.dto.ForumResponse;
import com.gymplatform.dto.ForumTopicDetailResponse;
import com.gymplatform.dto.ForumTopicSummaryResponse;
import com.gymplatform.exception.BusinessException;
import com.gymplatform.repository.ForumRepository;
import com.gymplatform.repository.ForumTopicRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ForumService {

    public static final String EXERCISES_SLUG = "exercises";

    private final ForumRepository forumRepository;
    private final ForumTopicRepository forumTopicRepository;

    public ForumService(ForumRepository forumRepository, ForumTopicRepository forumTopicRepository) {
        this.forumRepository = forumRepository;
        this.forumTopicRepository = forumTopicRepository;
    }

    public List<ForumResponse> listForums() {
        return forumRepository.findByActiveTrueOrderByTitleAsc().stream()
                .map(f -> new ForumResponse(
                        f.getId(),
                        f.getSlug(),
                        f.getTitle(),
                        f.getDescription(),
                        forumTopicRepository.findByForumIdAndActiveTrueOrderByTitleAsc(f.getId()).size()
                ))
                .toList();
    }

    public Forum requireForumBySlug(String slug) {
        return forumRepository.findBySlugAndActiveTrue(slug)
                .orElseThrow(() -> new BusinessException("Foro no encontrado"));
    }

    public List<ForumTopicSummaryResponse> listTopics(String forumSlug, MuscleGroup muscleGroup) {
        Forum forum = requireForumBySlug(forumSlug);
        List<ForumTopic> topics = muscleGroup != null
                ? forumTopicRepository.findByForumIdAndActiveTrueAndMuscleGroupOrderByTitleAsc(forum.getId(), muscleGroup)
                : forumTopicRepository.findByForumIdAndActiveTrueOrderByTitleAsc(forum.getId());
        return topics.stream().map(this::toSummary).toList();
    }

    public ForumTopicDetailResponse getTopic(Long topicId) {
        ForumTopic topic = forumTopicRepository.findByIdAndActiveTrue(topicId)
                .orElseThrow(() -> new BusinessException("Tema no encontrado"));
        return toDetail(topic);
    }

    public ForumTopicDetailResponse getTopicByExerciseId(Long exerciseId) {
        Forum forum = requireForumBySlug(EXERCISES_SLUG);
        ForumTopic topic = forumTopicRepository.findByForumIdAndExerciseIdAndActiveTrue(forum.getId(), exerciseId)
                .orElseThrow(() -> new BusinessException("No hay guía de foro para este ejercicio"));
        return toDetail(topic);
    }

    private ForumTopicSummaryResponse toSummary(ForumTopic t) {
        return new ForumTopicSummaryResponse(
                t.getId(),
                t.getExerciseId(),
                t.getTitle(),
                t.getImageUrl(),
                t.getVideoUrl(),
                t.getSourceUrl(),
                t.getMuscleGroup()
        );
    }

    private ForumTopicDetailResponse toDetail(ForumTopic t) {
        return new ForumTopicDetailResponse(
                t.getId(),
                t.getForum().getId(),
                t.getForum().getSlug(),
                t.getExerciseId(),
                t.getTitle(),
                t.getImageUrl(),
                t.getVideoUrl(),
                t.getSourceUrl(),
                t.getBodyMarkdown(),
                t.getMuscleGroup()
        );
    }
}
