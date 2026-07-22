package com.gymplatform.domain.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "routine_template_days")
public class RoutineTemplateDay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private RoutineTemplate template;

    @Column(nullable = false)
    private int dayNumber;

    @Column(nullable = false)
    private String dayLabel;

    @Column(nullable = false)
    private int orderIndex = 0;

    @OneToMany(mappedBy = "templateDay", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    private List<RoutineExercise> exercises = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public RoutineTemplate getTemplate() { return template; }
    public void setTemplate(RoutineTemplate template) { this.template = template; }
    public int getDayNumber() { return dayNumber; }
    public void setDayNumber(int dayNumber) { this.dayNumber = dayNumber; }
    public String getDayLabel() { return dayLabel; }
    public void setDayLabel(String dayLabel) { this.dayLabel = dayLabel; }
    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }
    public List<RoutineExercise> getExercises() { return exercises; }
    public void setExercises(List<RoutineExercise> exercises) { this.exercises = exercises; }
}
