package com.gymplatform.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gymplatform.domain.entity.Exercise;
import com.gymplatform.domain.entity.Forum;
import com.gymplatform.domain.entity.ForumTopic;
import com.gymplatform.domain.enums.MuscleGroup;
import com.gymplatform.repository.ExerciseRepository;
import com.gymplatform.repository.ForumRepository;
import com.gymplatform.repository.ForumTopicRepository;
import com.gymplatform.service.ForumService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Crea el foro «Ejercicios» y temas con contenido scraped de EresFitness (persistido).
 * Imagen/video siguen como URLs remotas.
 */
@Component
@Order(2)
public class ForumExerciseSeeder implements CommandLineRunner {

    private final ForumRepository forumRepository;
    private final ForumTopicRepository forumTopicRepository;
    private final ExerciseRepository exerciseRepository;
    private final ObjectMapper objectMapper;

    public ForumExerciseSeeder(
            ForumRepository forumRepository,
            ForumTopicRepository forumTopicRepository,
            ExerciseRepository exerciseRepository,
            ObjectMapper objectMapper
    ) {
        this.forumRepository = forumRepository;
        this.forumTopicRepository = forumTopicRepository;
        this.exerciseRepository = exerciseRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        Forum forum = forumRepository.findBySlugAndActiveTrue(ForumService.EXERCISES_SLUG)
                .orElseGet(Forum::new);
        forum.setSlug(ForumService.EXERCISES_SLUG);
        forum.setTitle("Ejercicios");
        forum.setDescription(
                "Guías de ejercicios (contenido basado en EresFitness). "
                        + "Texto persistido; imagen y video se referencian remotamente."
        );
        forum.setActive(true);
        forum = forumRepository.save(forum);

        List<TopicEntry> entries;
        try (InputStream in = new ClassPathResource("forum-exercise-topics.json").getInputStream()) {
            entries = objectMapper.readValue(in, new TypeReference<>() {});
        }

        Set<String> keep = new HashSet<>();
        for (TopicEntry entry : entries) {
            keep.add(entry.name().trim().toLowerCase());
            upsertTopic(forum, entry);
        }

        for (ForumTopic topic : forumTopicRepository.findByForumIdAndActiveTrueOrderByTitleAsc(forum.getId())) {
            if (!keep.contains(topic.getTitle().trim().toLowerCase())) {
                topic.setActive(false);
                forumTopicRepository.save(topic);
            }
        }
    }

    private void upsertTopic(Forum forum, TopicEntry entry) {
        ForumTopic topic = forumTopicRepository
                .findFirstByForumIdAndTitleIgnoreCase(forum.getId(), entry.name())
                .orElseGet(ForumTopic::new);

        topic.setForum(forum);
        topic.setTitle(entry.name());
        topic.setMuscleGroup(entry.muscleGroup());
        topic.setSourceUrl(blankToNull(entry.sourceUrl()));
        topic.setVideoUrl(blankToNull(entry.videoUrl()));
        topic.setImageUrl(blankToNull(entry.imageUrl()));
        topic.setBodyMarkdown(entry.bodyMarkdown() != null ? entry.bodyMarkdown() : "");
        topic.setActive(true);

        exerciseRepository.findFirstByNameIgnoreCaseAndMuscleGroup(entry.name(), entry.muscleGroup())
                .ifPresent(ex -> {
                    topic.setExerciseId(ex.getId());
                    syncExerciseMedia(ex, entry);
                });

        forumTopicRepository.save(topic);
    }

    /** Asegura imageUrl/videoUrl/guideUrl en el catálogo a partir del foro. */
    private void syncExerciseMedia(Exercise ex, TopicEntry entry) {
        boolean changed = false;
        String image = blankToNull(entry.imageUrl());
        String video = blankToNull(entry.videoUrl());
        String source = blankToNull(entry.sourceUrl());

        if (image != null && (ex.getImageUrl() == null || ex.getImageUrl().isBlank())) {
            ex.setImageUrl(image);
            changed = true;
        } else if (image != null && !image.equals(ex.getImageUrl())) {
            ex.setImageUrl(image);
            changed = true;
        }
        if (video != null && (ex.getVideoUrl() == null || ex.getVideoUrl().isBlank() || !video.equals(ex.getVideoUrl()))) {
            ex.setVideoUrl(video);
            changed = true;
        }
        if (source != null && (ex.getGuideUrl() == null || !source.equals(ex.getGuideUrl()))) {
            ex.setGuideUrl(source);
            changed = true;
        }
        if (changed) {
            exerciseRepository.save(ex);
        }
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    public record TopicEntry(
            String name,
            MuscleGroup muscleGroup,
            String sourceUrl,
            String imageUrl,
            String videoUrl,
            String bodyMarkdown
    ) {}
}
