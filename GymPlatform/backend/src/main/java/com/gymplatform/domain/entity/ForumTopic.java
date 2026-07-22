package com.gymplatform.domain.entity;

import com.gymplatform.domain.enums.MuscleGroup;
import jakarta.persistence.*;

@Entity
@Table(name = "forum_topics")
public class ForumTopic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "forum_id", nullable = false)
    private Forum forum;

    /** Ejercicio del catálogo asociado (foro de ejercicios). */
    private Long exerciseId;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String sourceUrl;

    /** Miniatura remota (referencia, no archivo local). */
    @Column(length = 1000)
    private String imageUrl;

    /** Video remoto (referencia). */
    @Column(length = 1000)
    private String videoUrl;

    /** Contenido scraped/persistido (markdown). */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String bodyMarkdown = "";

    @Enumerated(EnumType.STRING)
    private MuscleGroup muscleGroup;

    @Column(nullable = false)
    private boolean active = true;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Forum getForum() { return forum; }
    public void setForum(Forum forum) { this.forum = forum; }
    public Long getExerciseId() { return exerciseId; }
    public void setExerciseId(Long exerciseId) { this.exerciseId = exerciseId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }
    public String getBodyMarkdown() { return bodyMarkdown; }
    public void setBodyMarkdown(String bodyMarkdown) { this.bodyMarkdown = bodyMarkdown; }
    public MuscleGroup getMuscleGroup() { return muscleGroup; }
    public void setMuscleGroup(MuscleGroup muscleGroup) { this.muscleGroup = muscleGroup; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
