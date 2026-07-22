package com.gymplatform.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gymplatform.domain.entity.Exercise;
import com.gymplatform.domain.enums.ExerciseDifficulty;
import com.gymplatform.domain.enums.MuscleGroup;
import com.gymplatform.repository.ExerciseRepository;
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
 * Catálogo con referencias remotas a guías/videos (EresFitness).
 * No descarga ni almacena media; solo URLs.
 */
@Component
@Order(1)
public class ExerciseCatalogSeeder implements CommandLineRunner {

    private final ExerciseRepository exerciseRepository;
    private final ObjectMapper objectMapper;

    public ExerciseCatalogSeeder(ExerciseRepository exerciseRepository, ObjectMapper objectMapper) {
        this.exerciseRepository = exerciseRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        List<CatalogEntry> entries;
        try (InputStream in = new ClassPathResource("exercise-catalog-eresfitness.json").getInputStream()) {
            entries = objectMapper.readValue(in, new TypeReference<>() {});
        }

        Set<String> keep = new HashSet<>();
        for (CatalogEntry entry : entries) {
            keep.add(key(entry.muscleGroup(), entry.name()));
            upsert(entry);
        }

        for (Exercise existing : exerciseRepository.findAll()) {
            String k = key(existing.getMuscleGroup(), existing.getName());
            if (!keep.contains(k) && existing.isActive()) {
                existing.setActive(false);
                exerciseRepository.save(existing);
            }
        }
    }

    private void upsert(CatalogEntry entry) {
        Exercise exercise = exerciseRepository
                .findFirstByNameIgnoreCaseAndMuscleGroup(entry.name(), entry.muscleGroup())
                .orElseGet(Exercise::new);
        exercise.setName(entry.name());
        exercise.setMuscleGroup(entry.muscleGroup());
        exercise.setDifficulty(ExerciseDifficulty.BASIC);
        exercise.setImageUrl("");
        String video = entry.videoUrl() == null ? "" : entry.videoUrl().trim();
        exercise.setVideoUrl(video.isEmpty() ? null : video);
        String guide = entry.guideUrl() == null ? "" : entry.guideUrl().trim();
        exercise.setGuideUrl(guide.isEmpty() ? null : guide);
        exercise.setDescription(null);
        exercise.setActive(true);
        exerciseRepository.save(exercise);
    }

    private static String key(MuscleGroup group, String name) {
        return group.name() + "|" + name.trim().toLowerCase();
    }

    public record CatalogEntry(
            String name,
            MuscleGroup muscleGroup,
            String guideUrl,
            String videoUrl
    ) {}
}
