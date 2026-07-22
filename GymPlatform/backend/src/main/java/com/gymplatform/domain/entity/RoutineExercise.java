package com.gymplatform.domain.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "routine_exercises")
public class RoutineExercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String exerciseName;

    private Long catalogExerciseId;
    private String imageUrl;

    private Integer sets;
    private Integer reps;
    private String weight;
    private Integer durationSeconds;
    private String notes;

    @Column(nullable = false)
    private int orderIndex = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "routine_id")
    private Routine routine;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "routine_day_id")
    private RoutineDay routineDay;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private RoutineTemplate template;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_day_id")
    private RoutineTemplateDay templateDay;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getExerciseName() { return exerciseName; }
    public void setExerciseName(String exerciseName) { this.exerciseName = exerciseName; }
    public Long getCatalogExerciseId() { return catalogExerciseId; }
    public void setCatalogExerciseId(Long catalogExerciseId) { this.catalogExerciseId = catalogExerciseId; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public Integer getSets() { return sets; }
    public void setSets(Integer sets) { this.sets = sets; }
    public Integer getReps() { return reps; }
    public void setReps(Integer reps) { this.reps = reps; }
    public String getWeight() { return weight; }
    public void setWeight(String weight) { this.weight = weight; }
    public Integer getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(Integer durationSeconds) { this.durationSeconds = durationSeconds; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }
    public Routine getRoutine() { return routine; }
    public void setRoutine(Routine routine) { this.routine = routine; }
    public RoutineDay getRoutineDay() { return routineDay; }
    public void setRoutineDay(RoutineDay routineDay) { this.routineDay = routineDay; }
    public RoutineTemplate getTemplate() { return template; }
    public void setTemplate(RoutineTemplate template) { this.template = template; }
    public RoutineTemplateDay getTemplateDay() { return templateDay; }
    public void setTemplateDay(RoutineTemplateDay templateDay) { this.templateDay = templateDay; }
}
