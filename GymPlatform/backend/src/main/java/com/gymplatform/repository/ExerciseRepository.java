package com.gymplatform.repository;

import com.gymplatform.domain.entity.Exercise;
import com.gymplatform.domain.enums.MuscleGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExerciseRepository extends JpaRepository<Exercise, Long> {
    List<Exercise> findByActiveTrueOrderByMuscleGroupAscNameAsc();
    List<Exercise> findByActiveTrueAndMuscleGroupOrderByNameAsc(MuscleGroup muscleGroup);
    java.util.Optional<Exercise> findFirstByNameIgnoreCaseAndMuscleGroup(String name, MuscleGroup muscleGroup);
    long countByActiveTrue();
}
