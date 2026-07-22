package com.gymplatform.domain.entity;

import com.gymplatform.domain.enums.ExerciseDifficulty;
import com.gymplatform.domain.enums.MuscleGroup;
import jakarta.persistence.*;

@Entity
@Table(name = "exercises")
public class Exercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MuscleGroup muscleGroup;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExerciseDifficulty difficulty = ExerciseDifficulty.BASIC;

    /** Miniatura remota o vacía; el frontend puede usar videoUrl como preview. */
    @Column(nullable = false)
    private String imageUrl = "";

    /** URL remota del video demostrativo (p. ej. EresFitness wp-content). */
    @Column(length = 1000)
    private String videoUrl;

    /** URL de la guía externa (abre en popup/iframe). */
    @Column(length = 1000)
    private String guideUrl;

    private String description;

    @Column(nullable = false)
    private boolean active = true;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public MuscleGroup getMuscleGroup() { return muscleGroup; }
    public void setMuscleGroup(MuscleGroup muscleGroup) { this.muscleGroup = muscleGroup; }
    public ExerciseDifficulty getDifficulty() { return difficulty; }
    public void setDifficulty(ExerciseDifficulty difficulty) { this.difficulty = difficulty; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }
    public String getGuideUrl() { return guideUrl; }
    public void setGuideUrl(String guideUrl) { this.guideUrl = guideUrl; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
