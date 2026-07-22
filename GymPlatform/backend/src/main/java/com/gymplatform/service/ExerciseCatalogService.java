package com.gymplatform.service;

import com.gymplatform.domain.entity.Exercise;
import com.gymplatform.domain.enums.ExerciseDifficulty;
import com.gymplatform.domain.enums.MuscleGroup;
import com.gymplatform.dto.ExerciseCreateRequest;
import com.gymplatform.dto.ExerciseResponse;
import com.gymplatform.exception.BusinessException;
import com.gymplatform.repository.ExerciseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ExerciseCatalogService {

    private final ExerciseRepository exerciseRepository;

    public ExerciseCatalogService(ExerciseRepository exerciseRepository) {
        this.exerciseRepository = exerciseRepository;
    }

    public List<ExerciseResponse> findAll(MuscleGroup muscleGroup) {
        List<Exercise> exercises = muscleGroup != null
                ? exerciseRepository.findByActiveTrueAndMuscleGroupOrderByNameAsc(muscleGroup)
                : exerciseRepository.findByActiveTrueOrderByMuscleGroupAscNameAsc();
        return exercises.stream().map(this::toResponse).toList();
    }

    public Exercise findById(Long id) {
        return exerciseRepository.findById(id).orElse(null);
    }

    @Transactional
    public ExerciseResponse create(ExerciseCreateRequest request) {
        String name = request.name().trim();
        if (name.isEmpty()) {
            throw new BusinessException("El nombre del ejercicio es obligatorio");
        }

        var existing = exerciseRepository.findFirstByNameIgnoreCaseAndMuscleGroup(name, request.muscleGroup());
        if (existing.isPresent() && existing.get().isActive()) {
            throw new BusinessException("Ya existe un ejercicio con ese nombre en la categoría");
        }

        Exercise exercise = existing.orElseGet(Exercise::new);
        exercise.setName(name);
        exercise.setMuscleGroup(request.muscleGroup());
        exercise.setDifficulty(request.difficulty() != null ? request.difficulty() : ExerciseDifficulty.BASIC);
        exercise.setImageUrl("");
        exercise.setVideoUrl(null);
        exercise.setGuideUrl(null);
        exercise.setActive(true);
        if (request.description() != null && !request.description().isBlank()) {
            exercise.setDescription(request.description().trim());
        } else {
            exercise.setDescription(null);
        }

        return toResponse(exerciseRepository.save(exercise));
    }

    @Transactional
    public void delete(Long id) {
        Exercise exercise = exerciseRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Ejercicio no encontrado"));
        exercise.setActive(false);
        exerciseRepository.save(exercise);
    }

    private ExerciseResponse toResponse(Exercise exercise) {
        return new ExerciseResponse(
                exercise.getId(),
                exercise.getName(),
                exercise.getMuscleGroup(),
                exercise.getDifficulty(),
                exercise.getImageUrl(),
                exercise.getVideoUrl(),
                exercise.getGuideUrl(),
                exercise.getDescription()
        );
    }
}
